import { useState } from 'react'
import { format } from 'date-fns'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { candidatesApi } from '@/features/candidates/api'
import { cvBuilderApi } from '@/features/cv-builder/api'
import { ScorePanel } from '@/features/cv-builder/components/score-panel'

const scoreTone = (score: number) =>
  score >= 90
    ? 'text-green-600 dark:text-green-400'
    : score >= 60
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400'

// Every generated CV with its score, best first to fix last: pick one to see what costs it points.
export function CvScore() {
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data: candidates, isLoading: candidateLoading } = useQuery({
    queryKey: ['candidates', 'me'],
    queryFn: () => candidatesApi.mine(),
  })
  const candidate = candidates?.items[0]

  const { data: draftsResult, isLoading } = useQuery({
    queryKey: ['cv-drafts', candidate?.id],
    queryFn: () =>
      cvBuilderApi.list({ candidateId: candidate?.id, pageSize: 50 }),
    enabled: !!candidate,
  })
  const drafts = draftsResult?.items ?? []

  const scores = useQueries({
    queries: drafts.map((d) => ({
      queryKey: ['cv-draft-score', d.id, d.lastModified],
      queryFn: () => cvBuilderApi.score(d.id),
      retry: false,
    })),
  })

  const active = drafts.find((d) => d.id === selectedId) ?? drafts[0]

  if (candidateLoading || isLoading) {
    return <Skeleton className='h-64 w-full' />
  }

  if (drafts.length === 0) {
    return (
      <div className='rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground'>
        No CVs to score yet.{' '}
        <Link to='/cv-builder' className='underline'>
          Write one in the CV Writer
        </Link>
        .
      </div>
    )
  }

  return (
    <div className='grid gap-6 lg:grid-cols-[320px_1fr]'>
      <ul className='space-y-1'>
        {drafts.map((d, i) => {
          const score = scores[i]?.data?.overall
          return (
            <li key={d.id}>
              <button
                type='button'
                onClick={() => setSelectedId(d.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm hover:bg-muted/50 ${
                  d.id === active?.id ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <span className='min-w-0'>
                  <span className='block truncate font-medium'>{d.title}</span>
                  <span className='block text-xs text-muted-foreground'>
                    {format(new Date(d.lastModified), 'MMM d, yyyy')}
                  </span>
                </span>
                <span
                  className={`text-lg font-semibold ${
                    score === undefined
                      ? 'text-muted-foreground'
                      : scoreTone(score)
                  }`}
                >
                  {score ?? '…'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {active && (
        <div className='space-y-3'>
          <div className='flex items-center justify-between gap-2'>
            <h2 className='font-semibold'>{active.title}</h2>
            <Link to='/cv-builder' className='text-sm underline'>
              Open the CV Writer to fix it
            </Link>
          </div>
          <ScorePanel draftId={active.id} lastModified={active.lastModified} />
        </div>
      )}
    </div>
  )
}
