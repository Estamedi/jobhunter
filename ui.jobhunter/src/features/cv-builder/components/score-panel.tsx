import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cvBuilderApi, type CvScoreCheck } from '../api'

const tone = (score: number, max: number) => {
  const r = score / max
  return r >= 0.9
    ? 'text-green-600 dark:text-green-400'
    : r >= 0.6
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400'
}

function ScoreRing({ score }: { score: number }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  return (
    <div className='relative h-24 w-24 shrink-0'>
      <svg viewBox='0 0 96 96' className='h-full w-full -rotate-90'>
        <circle
          cx='48'
          cy='48'
          r={radius}
          fill='none'
          strokeWidth='8'
          className='stroke-muted'
        />
        <circle
          cx='48'
          cy='48'
          r={radius}
          fill='none'
          strokeWidth='8'
          strokeLinecap='round'
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className={`stroke-current transition-all ${tone(score, 100)}`}
        />
      </svg>
      <div className='absolute inset-0 flex flex-col items-center justify-center'>
        <span className='text-2xl leading-none font-semibold'>{score}</span>
        <span className='text-[10px] text-muted-foreground uppercase'>
          overall
        </span>
      </div>
    </div>
  )
}

function CheckDetail({ check }: { check: CvScoreCheck }) {
  return (
    <div className='space-y-2 rounded-md border bg-background p-3 text-sm'>
      <div>
        <p className='font-medium'>{check.title}</p>
        <p className='text-xs text-muted-foreground'>{check.description}</p>
        {check.detail && <p className='mt-1 text-xs'>{check.detail}</p>}
      </div>

      {check.issues.length === 0 ? (
        <p className='flex items-center gap-2 text-green-600 dark:text-green-400'>
          <Check className='h-4 w-4' /> Nothing to fix here.
        </p>
      ) : (
        <ul className='space-y-3'>
          {check.issues.map((issue, i) => (
            <li key={i} className='space-y-1'>
              <p className='flex items-start gap-2'>
                <TriangleAlert className='mt-0.5 h-4 w-4 shrink-0 text-amber-600' />
                {issue.message}
              </p>
              {issue.locations.length > 0 && (
                <ul className='ml-6 space-y-1'>
                  {issue.locations.slice(0, 6).map((l, j) => (
                    <li
                      key={j}
                      className='rounded bg-red-500/10 px-2 py-1 text-xs'
                    >
                      {l.text}
                    </li>
                  ))}
                  {issue.locations.length > 6 && (
                    <li className='text-xs text-muted-foreground'>
                      and {issue.locations.length - 6} more
                    </li>
                  )}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Scores the saved CV with fixed rules, so it updates the moment the CV does and each lost point points at
// the lines that caused it.
export function ScorePanel({
  draftId,
  lastModified,
}: {
  draftId: number
  lastModified: string
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  const score = useQuery({
    queryKey: ['cv-draft-score', draftId, lastModified],
    queryFn: () => cvBuilderApi.score(draftId),
    retry: false,
  })

  if (score.isLoading) {
    return <Skeleton className='h-32 w-full' />
  }
  if (score.isError || !score.data) {
    return (
      <div className='space-y-2 rounded-md border p-4 text-sm'>
        <p className='font-medium'>CV score</p>
        <p className='text-destructive'>Could not score this CV.</p>
        <Button variant='outline' size='sm' onClick={() => score.refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  const { overall, checks } = score.data
  const toFix = checks.filter((c) => c.score < 10)
  const done = checks.filter((c) => c.score >= 10)

  const row = (c: CvScoreCheck) => (
    <li key={c.id}>
      <button
        type='button'
        onClick={() => setOpenId(openId === c.id ? null : c.id)}
        className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted/50 ${
          openId === c.id ? 'border-primary bg-primary/5' : 'border-transparent'
        }`}
      >
        <span>{c.title}</span>
        <span className={`font-semibold ${tone(c.score, 10)}`}>{c.score}</span>
      </button>
      {openId === c.id && <CheckDetail check={c} />}
    </li>
  )

  return (
    <div className='space-y-4 rounded-md border p-4'>
      <div className='flex items-center gap-4'>
        <ScoreRing score={overall} />
        <div>
          <p className='font-semibold'>CV score</p>
          <p className='text-sm text-muted-foreground'>
            {toFix.length === 0
              ? 'Every check passes.'
              : `${toFix.length} ${toFix.length === 1 ? 'thing' : 'things'} to fix. Pick one to see the lines.`}
          </p>
        </div>
      </div>

      {toFix.length > 0 && (
        <div className='space-y-1'>
          <p className='text-xs font-medium text-muted-foreground uppercase'>
            To fix
          </p>
          <ul className='space-y-1'>{toFix.map(row)}</ul>
        </div>
      )}
      {done.length > 0 && (
        <div className='space-y-1'>
          <p className='text-xs font-medium text-muted-foreground uppercase'>
            Passed
          </p>
          <ul className='space-y-1'>{done.map(row)}</ul>
        </div>
      )}
    </div>
  )
}
