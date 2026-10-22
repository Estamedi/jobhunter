import { Link } from '@tanstack/react-router'
import { Loader2, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type JobApplication } from '@/features/applications/api'
import { type CvDraftSummary } from '../api'

export interface BatchProgress {
  done: number
  total: number
  failed: number
}

export function WishlistPanel({
  applications,
  drafts,
  isGenerating,
  progress,
  onSelectDraft,
  onGenerateAll,
}: {
  applications: JobApplication[]
  drafts: CvDraftSummary[]
  isGenerating: boolean
  progress: BatchProgress | null
  onSelectDraft: (id: number) => void
  onGenerateAll: () => void
}) {
  const draftFor = (applicationId: number) =>
    drafts.find((d) => d.jobApplicationId === applicationId)

  // A CV is only worth generating for a job whose posting we have, and only once.
  const pending = applications.filter(
    (a) => a.jobRoleDescription?.trim() && !draftFor(a.id)
  )

  return (
    <div className='rounded-md border p-4'>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <h2 className='font-semibold'>Your wishlist ({applications.length})</h2>
        {pending.length > 0 && (
          <Button
            size='sm'
            variant='outline'
            disabled={isGenerating}
            onClick={onGenerateAll}
          >
            {isGenerating ? (
              <Loader2 className='mr-1 h-4 w-4 animate-spin' />
            ) : (
              <Sparkles className='mr-1 h-4 w-4' />
            )}
            {isGenerating && progress
              ? `Writing ${progress.done + 1} of ${progress.total}…`
              : `Write all (${pending.length})`}
          </Button>
        )}
      </div>

      {applications.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          No jobs in your wishlist yet. Add jobs to the Wishlist column on the
          Applications page.
        </p>
      )}

      <ul className='divide-y'>
        {applications.map((a) => {
          const draft = draftFor(a.id)
          const hasPosting = !!a.jobRoleDescription?.trim()
          return (
            <li
              key={a.id}
              className='flex items-center justify-between gap-2 py-2'
            >
              <div className='min-w-0 text-sm'>
                <p className='truncate font-medium'>{a.jobRoleTitle}</p>
                <p className='truncate text-xs text-muted-foreground'>
                  {a.companyName}
                  {!hasPosting && ' · no job description'}
                </p>
              </div>
              {draft ? (
                <div className='flex shrink-0 items-center gap-2'>
                  <Badge variant='secondary'>CV ready</Badge>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => onSelectDraft(draft.id)}
                  >
                    View
                  </Button>
                </div>
              ) : (
                <Button
                  size='sm'
                  variant='ghost'
                  className='shrink-0'
                  disabled={isGenerating}
                  asChild
                >
                  <Link to='/cv-builder' search={{ applicationId: a.id }}>
                    Write CV
                  </Link>
                </Button>
              )}
            </li>
          )
        })}
      </ul>

      {progress && !isGenerating && (
        <p className='mt-3 text-xs text-muted-foreground'>
          Wrote {progress.done - progress.failed} of {progress.total} CVs
          {progress.failed > 0 &&
            ` (${progress.failed} failed, try them one by one)`}
          .
        </p>
      )}
    </div>
  )
}
