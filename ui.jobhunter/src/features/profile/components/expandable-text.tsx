import { useState } from 'react'
import { needsClamp } from '../lib/profile-summary'

// Text that is cut to three lines with a "see more" toggle when it is long, like LinkedIn. Short text is
// shown whole and has no toggle.
export function ExpandableText({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const long = needsClamp(text)

  return (
    <div className={className}>
      <p
        className={`text-sm whitespace-pre-line ${long && !open ? 'line-clamp-3' : ''}`}
      >
        {text}
      </p>
      {long && (
        <button
          type='button'
          className='mt-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline'
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'see less' : '…see more'}
        </button>
      )}
    </div>
  )
}
