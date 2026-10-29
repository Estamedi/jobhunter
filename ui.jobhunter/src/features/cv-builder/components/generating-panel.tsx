import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// The server does not report progress, so the steps are paced by time and worded as what is being
// done, never as a percentage that could be wrong. The last step stays active until the CV arrives.
const STEPS = [
  { at: 0, text: 'Reading the job description' },
  { at: 6, text: 'Matching it with your profile' },
  { at: 14, text: 'Writing your summary and skills' },
  { at: 22, text: 'Tailoring your experience' },
  { at: 32, text: 'Checking every fact against your profile' },
]

export function GeneratingPanel() {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

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
          This usually takes 20–40 seconds. You can keep this page open; the CV
          appears here when it is ready.
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
        {seconds > 60 && ' – taking longer than usual, still working.'}
      </p>
    </div>
  )
}
