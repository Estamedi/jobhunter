import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// The server does not report progress, so the steps are paced by time and worded as what is being
// done, never as a percentage that could be wrong. The last step stays active until the CV arrives.
const STEPS = [
  { at: 0, text: 'Reading the job description' },
  { at: 8, text: 'Matching it with your profile' },
  { at: 20, text: 'Writing your summary and skills' },
  { at: 40, text: 'Tailoring your experience' },
  { at: 70, text: 'Checking every fact against your profile' },
]

// `since` is when the draft was queued, so the clock is right after a reload or when the page is
// opened later. Without it the clock starts when the panel appears.
export function GeneratingPanel({ since }: { since?: string }) {
  const [start] = useState(() =>
    since ? new Date(since).getTime() : Date.now()
  )
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const seconds = Math.max(0, Math.floor((now - start) / 1000))

  const current = STEPS.reduce((acc, s, i) => (seconds >= s.at ? i : acc), 0)

  return (
    <div
      role='status'
      aria-live='polite'
      className='space-y-5 rounded-md border p-6'
    >
      <div>
        <p className='flex items-center gap-2 font-semibold'>
          <Loader2 className='h-4 w-4 animate-spin' /> Writing your CV…
        </p>
        <p className='text-sm text-muted-foreground'>
          This usually takes 1–2 minutes. It is written in the background, so
          you can leave this page: the CV appears here when it is ready.
        </p>
      </div>

      <ul className='space-y-2 text-sm'>
        {STEPS.map((s, i) => (
          <li
            key={s.text}
            className={`flex items-center gap-2 ${
              i > current ? 'text-muted-foreground/60' : ''
            }`}
          >
            {i < current ? (
              <Check className='h-4 w-4 text-primary' />
            ) : i === current ? (
              <Loader2 className='h-4 w-4 animate-spin text-primary' />
            ) : (
              <span className='h-4 w-4 rounded-full border' />
            )}
            <span className={i === current ? 'font-medium' : ''}>{s.text}</span>
          </li>
        ))}
      </ul>

      <div className='space-y-2 border-t pt-4' aria-hidden>
        <Skeleton className='mx-auto h-5 w-1/3' />
        <Skeleton className='h-3 w-full' />
        <Skeleton className='h-3 w-11/12' />
        <Skeleton className='h-3 w-4/5' />
      </div>

      <p className='text-xs text-muted-foreground'>
        {seconds}s elapsed
        {seconds > 150 && ' – taking longer than usual, still working.'}
      </p>
    </div>
  )
}
