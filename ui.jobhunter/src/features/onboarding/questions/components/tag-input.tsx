import { useState, type KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type TagInputProps = {
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
  suggestions?: string[]
}

export function TagInput({
  values,
  onChange,
  placeholder,
  suggestions = [],
}: TagInputProps) {
  const [draft, setDraft] = useState('')

  function add(value: string) {
    const v = value.trim()
    if (!v || values.some((x) => x.toLowerCase() === v.toLowerCase())) return
    onChange([...values, v])
    setDraft('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      add(draft)
    }
  }

  const remaining = suggestions.filter(
    (s) => !values.some((x) => x.toLowerCase() === s.toLowerCase())
  )

  return (
    <div className='space-y-3'>
      <div className='flex gap-2'>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className='h-10'
          autoFocus
        />
        <Button
          type='button'
          variant='outline'
          size='icon'
          className='size-10'
          aria-label='Add'
          disabled={!draft.trim()}
          onClick={() => add(draft)}
        >
          <Plus />
        </Button>
      </div>

      {values.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {values.map((v) => (
            <Badge key={v} variant='secondary' className='gap-1.5 py-1 ps-2.5 pe-1.5 text-sm'>
              {v}
              <button
                type='button'
                aria-label={`Remove ${v}`}
                className='rounded-full p-0.5 hover:bg-background/60'
                onClick={() => onChange(values.filter((x) => x !== v))}
              >
                <X className='size-3' />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {remaining.length > 0 && (
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-xs text-muted-foreground'>Suggestions:</span>
          {remaining.map((s) => (
            <button
              key={s}
              type='button'
              onClick={() => add(s)}
              className='rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground'
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
