import { format } from 'date-fns'
import { Loader2, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { type JobApplication } from '@/features/applications/api'
import { isWriting, type CvDraftSummary } from '../api'
import { WishlistPanel, type BatchProgress } from './wishlist-panel'

function DraftStatusLine({ draft }: { draft: CvDraftSummary }) {
  if (isWriting(draft.status)) {
    return (
      <span className='flex items-center gap-1 text-xs text-muted-foreground'>
        <Loader2 className='h-3 w-3 animate-spin' /> Writing…
      </span>
    )
  }
  if (draft.status === 'Failed') {
    return (
      <span className='text-xs text-destructive'>
        Could not be written. Open it to try again.
      </span>
    )
  }
  return (
    <span className='text-xs text-muted-foreground'>
      {format(new Date(draft.lastModified), 'MMM d, yyyy')}
    </span>
  )
}

// The page when no draft is open: every draft with its state, the wishlist, and the one place to start a
// new CV. Opening a draft leaves this view for the workspace.
export function DraftsList({
  drafts,
  loading,
  onOpen,
  onNew,
  applications,
  isGenerating,
  progress,
  onGenerateAll,
}: {
  drafts: CvDraftSummary[]
  loading: boolean
  onOpen: (id: number) => void
  onNew: () => void
  applications: JobApplication[]
  isGenerating: boolean
  progress: BatchProgress | null
  onGenerateAll: () => void
}) {
  const empty = !loading && drafts.length === 0

  return (
    <div className='grid gap-6 lg:grid-cols-[1fr_360px]'>
      <section className='min-w-0 rounded-md border p-4'>
        <div className='mb-3 flex items-center justify-between gap-2'>
          <h2 className='font-semibold'>Your drafts</h2>
          {!empty && (
            <Button size='sm' onClick={onNew}>
              <Plus className='mr-1 h-4 w-4' /> New CV
            </Button>
          )}
        </div>

        {loading && <Skeleton className='h-16 w-full' />}

        {empty && (
          <div className='flex flex-col items-center gap-3 rounded-md border border-dashed py-12 text-center'>
            <p className='text-sm text-muted-foreground'>
              You have no CV drafts yet.
            </p>
            <Button onClick={onNew}>
              <Sparkles className='mr-1 h-4 w-4' /> Create your first CV
            </Button>
          </div>
        )}

        <ul className='divide-y'>
          {drafts.map((d) => (
            <li key={d.id}>
              <button
                type='button'
                onClick={() => onOpen(d.id)}
                className='flex w-full flex-col gap-0.5 rounded px-2 py-2.5 text-left hover:bg-muted'
              >
                <span className='truncate text-sm font-medium'>{d.title}</span>
                <DraftStatusLine draft={d} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <WishlistPanel
        applications={applications}
        drafts={drafts}
        isGenerating={isGenerating}
        progress={progress}
        onSelectDraft={onOpen}
        onGenerateAll={onGenerateAll}
      />
    </div>
  )
}
