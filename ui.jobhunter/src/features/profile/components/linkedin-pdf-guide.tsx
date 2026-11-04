import { ChevronDown } from 'lucide-react'
import { IconLinkedin } from '@/assets/brand-icons'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

const STEPS = [
  <>
    Open your profile on{' '}
    <a
      className='underline'
      href='https://www.linkedin.com/in/me/'
      target='_blank'
      rel='noopener noreferrer'
    >
      linkedin.com
    </a>{' '}
    (click <b>Me</b> → <b>View profile</b>) on a computer.
  </>,
  <>
    Under your name and headline, click the <b>Resources</b> button.
  </>,
  <>
    Choose <b>Save to PDF</b>. LinkedIn downloads the file to your computer.
  </>,
  <>Upload that PDF here. Check the sections it finds before importing.</>,
]

// How to export a LinkedIn profile as a PDF, shown wherever a CV can be uploaded.
export function LinkedinPdfGuide() {
  return (
    <Collapsible className='rounded-md border'>
      <CollapsibleTrigger className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium [&[data-state=open]>svg:last-child]:rotate-180'>
        <IconLinkedin className='h-4 w-4' />
        How to get your PDF from LinkedIn
        <ChevronDown className='ml-auto h-4 w-4 transition-transform' />
      </CollapsibleTrigger>
      <CollapsibleContent className='space-y-3 border-t px-3 py-3'>
        <ol className='list-decimal space-y-1 pl-5 text-sm text-muted-foreground'>
          {STEPS.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <img
          src='/images/linkedin-save-to-pdf.png'
          alt='LinkedIn profile with the Resources menu open and Save to PDF highlighted'
          className='w-full rounded-md border'
          loading='lazy'
        />
        <p className='text-xs text-muted-foreground'>
          On the LinkedIn mobile app this option is not available. Open
          linkedin.com in a browser and use the desktop site.
        </p>
      </CollapsibleContent>
    </Collapsible>
  )
}
