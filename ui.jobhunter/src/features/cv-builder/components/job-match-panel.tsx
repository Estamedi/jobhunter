import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Loader2, Plus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { profileApi } from '@/features/profile/api'
import { cvBuilderApi, type CvSection, type RequirementStatus } from '../api'
import { serverDetail } from '../lib/error-message'
import { jobFit } from '../lib/job-fit'

const GROUPS: { status: RequirementStatus; title: string; hint: string }[] = [
  {
    status: 'Missing',
    title: 'Not in your CV or profile',
    hint: 'Add one only if you really have it. The CV can only use what is on your profile.',
  },
  {
    status: 'InProfile',
    title: 'On your profile, not in this CV',
    hint: 'You have these. Ask the AI to work them in.',
  },
  {
    status: 'SkillsOnly',
    title: 'Only in the Skills list',
    hint: 'Recruiters and ATS give more weight to skills shown in your summary or experience.',
  },
  { status: 'InCv', title: 'Covered in your CV', hint: '' },
]

function Badge({ mustHave }: { mustHave: boolean }) {
  return (
    <span
      className={
        mustHave
          ? 'rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary'
          : 'rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground'
      }
    >
      {mustHave ? 'Must have' : 'Nice to have'}
    </span>
  )
}

// Shows which skills the job asks for and whether this CV covers them. A skill the candidate does not
// have is never added for them: "I have this" saves it to their own profile first, then the CV is
// rewritten from the profile.
export function JobMatchPanel({
  draftId,
  lastModified,
  hasJobDescription,
  candidateId,
  onRefine,
}: {
  draftId: number
  lastModified: string
  hasJobDescription: boolean
  candidateId: number
  onRefine: (section: CvSection, instruction: string) => void
}) {
  const qc = useQueryClient()

  const match = useQuery({
    queryKey: ['cv-draft-match', draftId, lastModified],
    queryFn: () => cvBuilderApi.match(draftId),
    enabled: hasJobDescription,
    retry: false,
  })

  // Skills ticked to add to the profile, and skills ticked to work into the CV.
  const [selected, setSelected] = useState<string[]>([])
  const [toWorkIn, setToWorkIn] = useState<string[]>([])

  // Adds several skills in one go, then asks for a single CV rewrite covering all of them.
  const addSkills = useMutation({
    mutationFn: async (names: string[]) => {
      const results = await Promise.allSettled(
        names.map((n) => profileApi.addSkill(candidateId, n))
      )
      const added = names.filter((_, i) => results[i].status === 'fulfilled')
      if (added.length === 0) throw new Error('none added')
      return { added, failed: names.length - added.length }
    },
    onSuccess: ({ added, failed }) => {
      qc.invalidateQueries({ queryKey: ['profile', candidateId] })
      qc.invalidateQueries({ queryKey: ['cv-draft-match', draftId] })
      setSelected([])
      toast.success(
        `Added ${added.length} skill${added.length === 1 ? '' : 's'} to your profile`
      )
      if (failed > 0) toast.error(`${failed} could not be added`)
      onRefine(
        'skills',
        `Include these skills, which I have added to my profile, where they are relevant to the job: ${added.join(', ')}.`
      )
    },
    onError: () => toast.error('Failed to add the skills to your profile'),
  })

  if (!hasJobDescription) {
    return (
      <div className='rounded-md border p-4 text-sm text-muted-foreground'>
        Job match: this draft has no job description, so there is nothing to
        compare it with.
      </div>
    )
  }

  if (match.isLoading) {
    return (
      <div className='space-y-2 rounded-md border p-4'>
        <p className='text-sm font-medium'>Job match</p>
        <Skeleton className='h-4 w-2/3' />
        <Skeleton className='h-4 w-1/2' />
        <p className='text-xs text-muted-foreground'>
          Reading the job description…
        </p>
      </div>
    )
  }

  if (match.isError || !match.data) {
    return (
      <div className='space-y-2 rounded-md border p-4 text-sm'>
        <p className='font-medium'>Job match</p>
        <p className='text-destructive'>
          {serverDetail(match.error, 'Could not check the CV against the job.')}
        </p>
        <Button variant='outline' size='sm' onClick={() => match.refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  const { requirements, otherRequirements } = match.data
  const fit = jobFit(requirements)
  const busy = addSkills.isPending

  const toggle =
    (set: (fn: (prev: string[]) => string[]) => void, name: string) =>
    (checked: boolean | 'indeterminate') =>
      set((prev) =>
        checked ? [...prev, name] : prev.filter((n) => n !== name)
      )

  const workIn = () => {
    onRefine(
      'experience',
      `Work these skills into the most relevant experience bullets, only where my background supports it: ${toWorkIn.join(', ')}.`
    )
    setToWorkIn([])
  }

  const notes = [
    fit.skillsOnly > 0 && `${fit.skillsOnly} only in the Skills list`,
    fit.inProfile > 0 && `${fit.inProfile} on your profile but not in this CV`,
    fit.missing > 0 && `${fit.missing} not on your profile`,
  ].filter(Boolean)

  return (
    <div className='flex flex-col gap-3 rounded-md border p-4'>
      <div>
        <p className='text-sm font-medium'>Job match</p>
        <p className='text-sm'>
          {fit.total > 0
            ? `${fit.inCv} of ${fit.total} must-have skills are in your summary or experience.`
            : 'The job description does not list specific must-have skills.'}
        </p>
        {notes.length > 0 && (
          <p className='text-xs text-muted-foreground'>{notes.join(' · ')}</p>
        )}
      </div>

      {GROUPS.map((group) => {
        const items = requirements.filter((r) => r.status === group.status)
        if (items.length === 0) return null
        const adds = group.status === 'Missing'
        const works =
          group.status === 'InProfile' || group.status === 'SkillsOnly'
        const ticked = items.filter((r) =>
          (adds ? selected : toWorkIn).includes(r.name)
        )
        const setTicked = adds ? setSelected : setToWorkIn

        return (
          <div key={group.status} className='flex flex-col gap-1'>
            <p className='text-xs font-medium'>
              {group.title} ({items.length})
            </p>
            {group.hint && (
              <p className='text-xs text-muted-foreground'>{group.hint}</p>
            )}

            {(adds || works) && (
              <div className='flex flex-wrap items-center gap-2 py-1'>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 text-xs'
                  disabled={busy}
                  onClick={() =>
                    setTicked((prev) => {
                      const rest = prev.filter(
                        (n) => !items.some((i) => i.name === n)
                      )
                      return ticked.length === items.length
                        ? rest
                        : [...rest, ...items.map((i) => i.name)]
                    })
                  }
                >
                  {ticked.length === items.length
                    ? 'Clear selection'
                    : 'Select all'}
                </Button>
                {adds ? (
                  <Button
                    size='sm'
                    className='h-7 text-xs'
                    disabled={busy || ticked.length === 0}
                    onClick={() => addSkills.mutate(ticked.map((r) => r.name))}
                  >
                    {busy ? (
                      <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                    ) : (
                      <Plus className='mr-1 h-3 w-3' />
                    )}
                    Add {ticked.length > 0 ? `${ticked.length} ` : ''}to my
                    profile
                  </Button>
                ) : (
                  <Button
                    size='sm'
                    className='h-7 text-xs'
                    disabled={ticked.length === 0}
                    onClick={workIn}
                  >
                    <Sparkles className='mr-1 h-3 w-3' />
                    Work {ticked.length > 0 ? `${ticked.length} ` : ''}into my
                    CV
                  </Button>
                )}
                {ticked.length === 0 && (
                  <span className='text-xs text-muted-foreground'>
                    {adds
                      ? 'Tick the skills you really have.'
                      : 'Tick the skills to add to your experience.'}
                  </span>
                )}
              </div>
            )}

            <ul className='flex flex-col gap-1'>
              {items.map((r) =>
                adds || works ? (
                  <li key={r.name}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/50',
                        ticked.includes(r)
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent'
                      )}
                    >
                      <Checkbox
                        className='border-foreground/40'
                        checked={(adds ? selected : toWorkIn).includes(r.name)}
                        disabled={adds && busy}
                        onCheckedChange={toggle(setTicked, r.name)}
                      />
                      <span className='flex items-center gap-2'>
                        {r.name} <Badge mustHave={r.mustHave} />
                      </span>
                    </label>
                  </li>
                ) : (
                  <li
                    key={r.name}
                    className='flex items-center gap-2 px-3 py-1 text-sm'
                  >
                    {r.name} <Badge mustHave={r.mustHave} />
                  </li>
                )
              )}
            </ul>
          </div>
        )
      })}

      {otherRequirements.length > 0 && (
        <div className='flex flex-col gap-1'>
          <p className='text-xs font-medium'>Also in the job description</p>
          <ul className='list-disc pl-5 text-sm text-muted-foreground'>
            {otherRequirements.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      )}

      <p className='text-xs text-muted-foreground'>
        Compared with your CV and your profile. Extra notes typed in the CV
        Writer are not checked.{' '}
        <Link to='/profile' className='underline'>
          Edit profile
        </Link>
      </p>
    </div>
  )
}
