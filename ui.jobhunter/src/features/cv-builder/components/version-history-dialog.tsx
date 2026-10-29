import { useState } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cvBuilderApi, type CvContent } from '../api'
import { diffCv, summarizeChanges } from '../lib/cv-diff'
import { CvPreview } from './cv-preview'

// Earlier copies of a draft: the content as it was just before each hand edit, refine or restore. Shows
// what the change did (this version compared with the CV right after it) or the whole earlier CV, and can
// restore it.
export function VersionHistoryDialog({
  open,
  onOpenChange,
  draftId,
  lastModified,
  currentContent,
  header,
  isRestoring,
  onRestore,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  draftId: number
  lastModified: string
  currentContent: CvContent
  header: {
    fullName: string
    email?: string
    phone?: string
    location?: string
  }
  isRestoring: boolean
  onRestore: (versionId: number) => void
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [view, setView] = useState<'changes' | 'full'>('changes')

  const { data: versions, isLoading } = useQuery({
    queryKey: ['cv-draft-versions', draftId, lastModified],
    queryFn: () => cvBuilderApi.versions(draftId),
    enabled: open,
  })

  // Show the newest version until the user picks another one.
  const activeId = selectedId ?? versions?.[0]?.id ?? null

  const { data: version, isLoading: versionLoading } = useQuery({
    queryKey: ['cv-draft-version', draftId, activeId],
    queryFn: () => cvBuilderApi.version(draftId, activeId!),
    enabled: open && activeId !== null,
  })

  // A version is the CV just before a change, so the change's result is the next newer version, or the
  // current CV when this is the newest one.
  const activeIndex = versions?.findIndex((v) => v.id === activeId) ?? -1
  const afterId = activeIndex > 0 ? versions![activeIndex - 1].id : null

  const { data: afterVersion } = useQuery({
    queryKey: ['cv-draft-version', draftId, afterId],
    queryFn: () => cvBuilderApi.version(draftId, afterId!),
    enabled: open && afterId !== null,
  })

  const afterContent =
    activeIndex === 0 ? currentContent : afterVersion?.content
  const changes =
    version && afterContent ? diffCv(version.content, afterContent) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-hidden sm:max-w-6xl'>
        <DialogHeader>
          <DialogTitle>Version history</DialogTitle>
        </DialogHeader>
        <p className='text-sm text-muted-foreground'>
          Each version is the CV as it was just before a change replaced it. The
          last 20 are kept. Restoring one saves your current CV first, so you
          can undo it.
        </p>

        {isLoading ? (
          <Skeleton className='h-64 w-full' />
        ) : !versions || versions.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>
            No earlier versions yet. One is saved each time you edit, refine or
            restore this CV.
          </p>
        ) : (
          <div className='grid gap-4 md:grid-cols-[16rem_1fr]'>
            <ul className='max-h-[60vh] space-y-1 overflow-y-auto pr-1'>
              {versions.map((v) => (
                <li key={v.id}>
                  <button
                    type='button'
                    onClick={() => setSelectedId(v.id)}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                      v.id === activeId ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <span className='block font-medium'>{v.reason}</span>
                    <span className='block text-xs text-muted-foreground'>
                      {format(new Date(v.created), 'd MMM yyyy, HH:mm')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className='space-y-3'>
              <div className='flex justify-end'>
                <Button
                  size='sm'
                  disabled={!activeId || isRestoring}
                  onClick={() => activeId && onRestore(activeId)}
                >
                  {isRestoring && (
                    <Loader2 className='mr-1 h-4 w-4 animate-spin' />
                  )}
                  Restore this version
                </Button>
              </div>
              <div className='inline-flex rounded-md border p-0.5 text-sm'>
                {(['changes', 'full'] as const).map((v) => (
                  <button
                    key={v}
                    type='button'
                    onClick={() => setView(v)}
                    className={`rounded px-3 py-1 ${
                      view === v ? 'bg-primary text-primary-foreground' : ''
                    }`}
                  >
                    {v === 'changes' ? 'What changed' : 'Full CV'}
                  </button>
                ))}
              </div>
              <div className='max-h-[60vh] overflow-auto rounded-md bg-muted/40 p-3'>
                {versionLoading || !version ? (
                  <Skeleton className='h-64 w-full' />
                ) : view === 'full' ? (
                  <CvPreview header={header} content={version.content} />
                ) : !changes ? (
                  <Skeleton className='h-64 w-full' />
                ) : (
                  <div className='space-y-3 text-sm'>
                    <p className='font-medium'>{summarizeChanges(changes)}</p>
                    {changes.map((c) => (
                      <div
                        key={c.label}
                        className='space-y-1 rounded-md border bg-background p-3'
                      >
                        <p className='font-medium'>
                          {c.label}{' '}
                          <span className='font-normal text-muted-foreground'>
                            – {c.summary}
                          </span>
                        </p>
                        {c.removed.map((t) => (
                          <p
                            key={`r-${t}`}
                            className='rounded bg-red-500/10 px-2 py-1 text-red-700 line-through dark:text-red-300'
                          >
                            {t}
                          </p>
                        ))}
                        {c.added.map((t) => (
                          <p
                            key={`a-${t}`}
                            className='rounded bg-green-500/10 px-2 py-1 text-green-700 dark:text-green-300'
                          >
                            {t}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
