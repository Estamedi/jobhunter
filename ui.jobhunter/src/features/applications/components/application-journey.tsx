import { Check, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STAGE_ACCENTS } from '../data/constants'
import type { BoardStage } from '../hooks/use-board-stages'

interface ApplicationJourneyProps {
  stages: BoardStage[]
  status: string
  rejectionReason?: string
  onChangeStatus: (status: string) => void
  disabled?: boolean
}

// Only stages that aren't a "destructive" outcome (e.g. Rejected) form the linear journey —
// numbering an outcome that can branch off at any point would misrepresent it as a milestone.
export function ApplicationJourney({ stages, status, rejectionReason, onChangeStatus, disabled }: ApplicationJourneyProps) {
  const forward = stages.filter((s) => s.badgeVariant !== 'destructive')
  const terminal = stages.filter((s) => s.badgeVariant === 'destructive')
  const isTerminal = terminal.some((s) => s.status === status)

  if (isTerminal) {
    const currentTerminal = terminal.find((s) => s.status === status)
    return (
      <div className='rounded-2xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900 dark:bg-rose-950/20'>
        <div className='flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-400'>
          <XCircle className='size-4' />
          {currentTerminal?.label ?? 'This one didn’t work out'}
        </div>
        {rejectionReason && <p className='mt-2 text-sm text-muted-foreground'>{rejectionReason}</p>}
        <p className='mt-3 text-xs text-muted-foreground'>Every application is a rep — reopen it if things change.</p>
        <div className='mt-3 flex flex-wrap gap-2'>
          {forward.map((s) => (
            <button
              key={s.status}
              type='button'
              disabled={disabled}
              onClick={() => onChangeStatus(s.status)}
              className='rounded-full border border-input px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50'
            >
              Reopen as {s.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const currentPos = forward.findIndex((s) => s.status === status)

  return (
    <div className='flex items-start'>
      {forward.map((s, i) => {
        const accent = STAGE_ACCENTS[stages.findIndex((x) => x.status === s.status) % STAGE_ACCENTS.length]
        const state = currentPos < 0 ? 'upcoming' : i < currentPos ? 'done' : i === currentPos ? 'active' : 'upcoming'

        return (
          <div key={s.status} className={cn('flex items-start', i < forward.length - 1 && 'flex-1')}>
            <button
              type='button'
              disabled={disabled}
              onClick={() => onChangeStatus(s.status)}
              className='flex flex-col items-center gap-1.5 disabled:opacity-60'
            >
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                  state === 'done' && cn('border-transparent text-white', accent.dot),
                  state === 'active' && cn('ring-2 ring-offset-2 ring-offset-background', accent.tint, accent.ring, 'border-transparent'),
                  state === 'upcoming' && 'border-dashed border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {state === 'done' ? <Check className='size-4' /> : i + 1}
              </span>
              <span className={cn('max-w-20 text-center text-xs font-medium', state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground')}>
                {s.label}
              </span>
            </button>
            {i < forward.length - 1 && (
              <span className={cn('mt-4 h-0.5 flex-1 rounded', i < currentPos ? accent.dot : 'bg-border')} />
            )}
          </div>
        )
      })}
      {terminal.length > 0 && (
        <button
          type='button'
          disabled={disabled}
          onClick={() => onChangeStatus(terminal[0].status)}
          className='ml-3 shrink-0 self-center text-xs font-medium text-muted-foreground transition-colors hover:text-rose-600 disabled:opacity-50'
        >
          Mark as {terminal[0].label.toLowerCase()}
        </button>
      )}
    </div>
  )
}
