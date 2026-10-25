import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type OptionTileProps = {
  label: string
  description?: string
  selected: boolean
  multiple?: boolean
  onClick: () => void
}

export function OptionTile({
  label,
  description,
  selected,
  multiple,
  onClick,
}: OptionTileProps) {
  return (
    <button
      type='button'
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3.5 text-start font-medium transition-all outline-none',
        'hover:border-primary/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        selected && 'border-primary bg-accent'
      )}
    >
      {multiple && (
        <span
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input',
            selected && 'border-primary bg-primary text-primary-foreground'
          )}
        >
          {selected && <Check className='size-3' />}
        </span>
      )}
      <span className='min-w-0 flex-1'>
        <span className='block text-sm'>{label}</span>
        {description && (
          <span className='block text-xs font-normal text-muted-foreground'>
            {description}
          </span>
        )}
      </span>
    </button>
  )
}
