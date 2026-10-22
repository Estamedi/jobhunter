import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cvsApi } from '@/features/cvs/api'
import {
  profileApi,
  type ImportMode,
  type ParsedProfile,
  type SaveExperienceDto,
} from '../api'
import { formatMonthYear } from '../lib/experience'

type Step = 'choose' | 'review'

// An experience can only be saved with a start date.
const isImportable = (e: ParsedProfile['experiences'][number]) =>
  !!e.title && !!e.company && !!e.startDate

export function ImportDialog({
  candidateId,
  onOpenChange,
  onImported,
}: {
  candidateId: number
  onOpenChange: (open: boolean) => void
  onImported: (added: number) => void
}) {
  const [step, setStep] = useState<Step>('choose')
  const [file, setFile] = useState<File | null>(null)
  const [cvId, setCvId] = useState<number | null>(null)
  const [parsed, setParsed] = useState<ParsedProfile | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [mode, setMode] = useState<ImportMode>('Merge')

  const { data: cvs } = useQuery({
    queryKey: ['cvs', candidateId, 'import'],
    queryFn: () => cvsApi.list({ candidateId, pageSize: 50 }),
  })

  const analyze = useMutation({
    mutationFn: async () => {
      const id = file ? await cvsApi.upload({ candidateId, file }) : cvId
      if (!id) throw new Error('No CV selected')
      const result = await profileApi.previewImport(id)
      return { id, result }
    },
    onSuccess: ({ id, result }) => {
      setCvId(id)
      setParsed(result)
      setSelected(
        new Set(
          result.experiences
            .map((e, i) => (isImportable(e) ? i : -1))
            .filter((i) => i >= 0)
        )
      )
      setStep('review')
    },
    onError: () =>
      toast.error(
        'Could not read this CV. Use a text-based PDF or DOCX and try again.'
      ),
  })

  const save = useMutation({
    mutationFn: () => {
      const experiences: SaveExperienceDto[] = parsed!.experiences
        .filter((_, i) => selected.has(i))
        .map((e) => ({
          title: e.title,
          employmentType: e.employmentType ?? null,
          company: e.company,
          isCurrent: e.isCurrent,
          startDate: e.startDate!,
          endDate: e.isCurrent ? null : (e.endDate ?? null),
          location: e.location ?? null,
          workplaceType: e.workplaceType ?? null,
          description: e.description ?? null,
          skills: e.skills,
        }))
      return profileApi.importProfile({
        candidateId,
        cvId: cvId ?? undefined,
        mode,
        headline: parsed!.headline ?? null,
        summary: parsed!.summary ?? null,
        experiences,
      })
    },
    onSuccess: (added) => onImported(added),
    onError: () => toast.error('Failed to import the profile'),
  })

  const toggle = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Import from CV</DialogTitle>
          <DialogDescription>
            {step === 'choose'
              ? 'Upload your current CV (PDF or DOCX) and we will fill in your profile. You review everything before it is saved.'
              : 'Check what was found. Uncheck anything you do not want to import.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'choose' && (
          <div className='space-y-4'>
            <div className='space-y-1'>
              <Label htmlFor='import-file'>Upload a new CV</Label>
              <Input
                id='import-file'
                type='file'
                accept='.pdf,.docx'
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null)
                  if (e.target.files?.[0]) setCvId(null)
                }}
              />
            </div>

            {(cvs?.items.length ?? 0) > 0 && (
              <div className='space-y-2'>
                <Label>Or use one you already uploaded</Label>
                <RadioGroup
                  value={cvId ? String(cvId) : ''}
                  onValueChange={(v) => {
                    setCvId(Number(v))
                    setFile(null)
                  }}
                >
                  {cvs!.items
                    .filter((c) => /\.(pdf|docx)$/i.test(c.fileName))
                    .map((c) => (
                      <div key={c.id} className='flex items-center gap-2'>
                        <RadioGroupItem
                          value={String(c.id)}
                          id={`cv-${c.id}`}
                        />
                        <Label htmlFor={`cv-${c.id}`} className='font-normal'>
                          {c.fileName}
                        </Label>
                      </div>
                    ))}
                </RadioGroup>
              </div>
            )}
          </div>
        )}

        {step === 'review' && parsed && (
          <div className='space-y-4'>
            {(parsed.headline || parsed.summary) && (
              <div className='rounded-md border p-3 text-sm'>
                {parsed.headline && (
                  <p className='font-semibold'>{parsed.headline}</p>
                )}
                {parsed.summary && (
                  <p className='mt-1 whitespace-pre-line text-muted-foreground'>
                    {parsed.summary}
                  </p>
                )}
              </div>
            )}

            <div className='space-y-2'>
              <p className='text-sm font-medium'>
                Experience ({selected.size} of {parsed.experiences.length}{' '}
                selected)
              </p>
              {parsed.experiences.length === 0 && (
                <p className='text-sm text-muted-foreground'>
                  No experience was found in this CV.
                </p>
              )}
              {parsed.experiences.map((e, i) => {
                const ok = isImportable(e)
                return (
                  <label
                    key={i}
                    className={`flex items-start gap-3 rounded-md border p-3 ${ok ? 'cursor-pointer' : 'opacity-60'}`}
                  >
                    <Checkbox
                      className='mt-1'
                      disabled={!ok}
                      checked={selected.has(i)}
                      onCheckedChange={() => toggle(i)}
                    />
                    <div className='min-w-0 text-sm'>
                      <p className='font-semibold'>{e.title}</p>
                      <p>{e.company}</p>
                      <p className='text-muted-foreground'>
                        {ok
                          ? `${formatMonthYear(e.startDate)} - ${e.isCurrent || !e.endDate ? 'Present' : formatMonthYear(e.endDate)}`
                          : 'Start date missing - add this role manually'}
                      </p>
                      {e.description && (
                        <p className='mt-1 line-clamp-3 whitespace-pre-line text-muted-foreground'>
                          {e.description}
                        </p>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>

            <div className='space-y-2'>
              <p className='text-sm font-medium'>
                If you already have experience on your profile
              </p>
              <RadioGroup
                value={mode}
                onValueChange={(v) => setMode(v as ImportMode)}
              >
                <div className='flex items-center gap-2'>
                  <RadioGroupItem value='Merge' id='mode-merge' />
                  <Label htmlFor='mode-merge' className='font-normal'>
                    Merge: add only roles that are not there yet
                  </Label>
                </div>
                <div className='flex items-center gap-2'>
                  <RadioGroupItem value='Replace' id='mode-replace' />
                  <Label htmlFor='mode-replace' className='font-normal'>
                    Replace: remove my current experience first
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === 'choose' ? (
            <Button
              disabled={(!file && !cvId) || analyze.isPending}
              onClick={() => analyze.mutate()}
            >
              {analyze.isPending ? (
                <Loader2 className='mr-1 h-4 w-4 animate-spin' />
              ) : (
                <Sparkles className='mr-1 h-4 w-4' />
              )}
              {analyze.isPending ? 'Reading your CV…' : 'Analyze CV'}
            </Button>
          ) : (
            <Button
              disabled={
                save.isPending ||
                (selected.size === 0 && !parsed?.headline && !parsed?.summary)
              }
              onClick={() => save.mutate()}
            >
              {save.isPending && (
                <Loader2 className='mr-1 h-4 w-4 animate-spin' />
              )}
              Import
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
