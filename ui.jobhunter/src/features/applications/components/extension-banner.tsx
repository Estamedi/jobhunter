import { useState } from 'react'
import { Puzzle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CHROME_EXTENSION_URL =
  'https://chromewebstore.google.com/detail/applyladder-job-saver/cgcbolcpejagpjpdkdmgppkcohclhcen'
const STORAGE_KEY = 'applyladder:extension-banner-dismissed'

function isDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function ExtensionBanner() {
  const [dismissed, setDismissed] = useState(isDismissed)
  if (dismissed) return null

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div className='flex items-start gap-3 rounded-lg border bg-muted/40 p-4'>
      <Puzzle className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
      <div className='flex-1 space-y-1'>
        <p className='text-sm font-medium'>Save jobs in one click with the Chrome extension</p>
        <p className='text-sm text-muted-foreground'>
          Install ApplyLadder Job Saver to capture postings from LinkedIn, Indeed and any career page. AI fills in the
          title, company, salary and requirements, and nothing is saved until you confirm. It only reads a page when you
          click it.
        </p>
        <Button asChild size='sm' className='mt-2'>
          <a href={CHROME_EXTENSION_URL} target='_blank' rel='noopener noreferrer'>
            Add to Chrome
          </a>
        </Button>
      </div>
      <Button variant='ghost' size='icon' className='h-7 w-7' onClick={dismiss} aria-label='Dismiss'>
        <X className='h-4 w-4' />
      </Button>
    </div>
  )
}
