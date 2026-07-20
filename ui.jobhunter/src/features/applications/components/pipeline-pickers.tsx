import { cn } from '@/lib/utils'
import { formatStatusLabel, STAGE_ACCENTS, UNKNOWN_STAGE_ACCENT } from '../data/constants'
import type { BoardStage } from '../hooks/use-board-stages'

function PickerPill({
  label,
  dotClassName,
  selected,
  selectedClassName,
  onClick,
}: {
  label: string
  dotClassName: string
  selected: boolean
  selectedClassName: string
  onClick: () => void
}) {
  return (
    <button
      type='button'
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        selected
          ? cn('border-transparent ring-2 ring-inset', selectedClassName)
          : 'border-input text-muted-foreground hover:bg-muted'
      )}
    >
      <span className={cn('size-2 shrink-0 rounded-full', dotClassName)} />
      {label}
    </button>
  )
}

interface StagePickerProps {
  stages: BoardStage[]
  value?: string
  onChange: (status: string) => void
}

export function StagePicker({ stages, value, onChange }: StagePickerProps) {
  const isKnown = stages.some((s) => s.status === value)

  return (
    <div className='flex flex-wrap gap-2'>
      {stages.map((stage, i) => {
        const accent = STAGE_ACCENTS[i % STAGE_ACCENTS.length]
        return (
          <PickerPill
            key={stage.status}
            label={stage.label}
            dotClassName={accent.dot}
            selected={value === stage.status}
            selectedClassName={cn(accent.tint, accent.ring)}
            onClick={() => onChange(stage.status)}
          />
        )
      })}
      {value && !isKnown && (
        <PickerPill
          label={formatStatusLabel(value)}
          dotClassName={UNKNOWN_STAGE_ACCENT.dot}
          selected
          selectedClassName={cn(UNKNOWN_STAGE_ACCENT.tint, UNKNOWN_STAGE_ACCENT.ring)}
          onClick={() => onChange(value)}
        />
      )}
    </div>
  )
}

const PRIORITY_ACCENTS: Record<string, { dot: string; tint: string; ring: string }> = {
  Low: { dot: 'bg-slate-400', tint: 'bg-slate-50 dark:bg-slate-500/10', ring: 'ring-slate-400/50' },
  High: { dot: 'bg-rose-500', tint: 'bg-rose-50 dark:bg-rose-500/10', ring: 'ring-rose-400/50' },
}

interface PriorityPickerProps {
  priorities: string[]
  value?: string
  onChange: (priority: string) => void
}

export function PriorityPicker({ priorities, value, onChange }: PriorityPickerProps) {
  return (
    <div className='flex flex-wrap gap-2'>
      {priorities.map((priority) => {
        const accent = PRIORITY_ACCENTS[priority] ?? PRIORITY_ACCENTS.Low
        return (
          <PickerPill
            key={priority}
            label={priority}
            dotClassName={accent.dot}
            selected={value === priority}
            selectedClassName={cn(accent.tint, accent.ring)}
            onClick={() => onChange(priority)}
          />
        )
      })}
    </div>
  )
}
