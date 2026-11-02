import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, Puzzle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const CHROME_EXTENSION_URL =
  'https://chromewebstore.google.com/detail/applyladder-job-saver/cgcbolcpejagpjpdkdmgppkcohclhcen'

const benefits = [
  'Capture postings from LinkedIn, Indeed and any career page',
  'AI fills in the title, company, salary and requirements',
  'Nothing is saved until you confirm',
]

function isChrome() {
  const ua = navigator.userAgent
  return /Chrome\//.test(ua) && !/Edg\/|OPR\//.test(ua)
}

export function OnboardingExtension() {
  const navigate = useNavigate()
  const goHome = () => navigate({ to: '/', replace: true })

  return (
    <main className='flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10'>
      <Card className='w-full max-w-xl gap-0 overflow-hidden rounded-3xl border-border/80 shadow-lg'>
        <CardHeader className='border-b px-8 py-7'>
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center gap-2 text-sm font-bold tracking-wide text-primary uppercase'>
              <span className='size-2 rounded-full bg-primary' />
              Step 4 of 4
            </div>
            <button
              type='button'
              onClick={goHome}
              className='inline-flex w-fit items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
            >
              Skip for now
            </button>
          </div>
          <CardTitle className='text-3xl font-bold tracking-tight'>
            Save jobs in one click
          </CardTitle>
          <CardDescription className='text-base'>
            Add the ApplyLadder Job Saver extension to build your pipeline
            faster.
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-6 px-8 py-7'>
          <div className='flex flex-col items-center rounded-3xl border border-primary/20 bg-accent/40 px-6 py-8 text-center dark:bg-primary/20'>
            <div className='mb-4 flex size-16 items-center justify-center rounded-3xl border border-primary/20 bg-accent text-primary shadow-sm dark:bg-primary/15'>
              <Puzzle className='size-8' />
            </div>
            <ul className='space-y-2 text-start text-sm'>
              {benefits.map((b) => (
                <li key={b} className='flex items-start gap-2'>
                  <CheckCircle2 className='mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400' />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {isChrome() ? (
            <Button asChild size='lg' className='w-full rounded-2xl'>
              <a
                href={CHROME_EXTENSION_URL}
                target='_blank'
                rel='noopener noreferrer'
              >
                Add to Chrome
              </a>
            </Button>
          ) : (
            <p className='rounded-2xl border bg-background p-4 text-center text-sm text-muted-foreground'>
              The extension works in Chrome. Open ApplyLadder on desktop Chrome
              to install it.
            </p>
          )}

          <Button
            variant='outline'
            size='lg'
            className='w-full rounded-2xl'
            onClick={goHome}
          >
            Continue to dashboard
            <ArrowRight className='size-4' />
          </Button>
        </CardContent>
      </Card>

      <p className='mt-6 text-sm text-muted-foreground'>
        You can install it anytime from your dashboard.
      </p>
    </main>
  )
}
