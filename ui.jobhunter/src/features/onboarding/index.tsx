import { ArrowRight, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function Onboarding() {
  return (
    <main className='flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10'>
      <Card className='w-full max-w-xl gap-0 overflow-hidden rounded-3xl border-border/80 shadow-lg'>
        <CardHeader className='border-b px-8 py-7'>
          <div className='mb-4 flex items-center gap-2 text-sm font-bold tracking-wide text-violet-500 uppercase'>
            <span className='size-2 rounded-full bg-violet-500' />
            Step 1 of 3
          </div>
          <CardTitle className='text-3xl font-bold tracking-tight'>
            Set up your profile
          </CardTitle>
          <CardDescription className='text-base'>
            Upload your CV and we'll do the rest.
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-6 px-8 py-7'>
          <label
            htmlFor='cv-upload'
            className='flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-violet-200 bg-violet-50/40 px-6 text-center transition-colors hover:border-violet-400 hover:bg-violet-50 dark:border-violet-900 dark:bg-violet-950/20 dark:hover:border-violet-600'
          >
            <input
              id='cv-upload'
              type='file'
              accept='.pdf,.doc,.docx,.txt'
              className='sr-only'
            />
            <div className='mb-5 flex size-18 items-center justify-center rounded-3xl border border-violet-200 bg-violet-100 text-violet-600 shadow-sm dark:border-violet-800 dark:bg-violet-950'>
              <Upload className='size-8' />
            </div>
            <p className='text-lg font-bold'>Drop your CV here</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              PDF, DOCX or TXT - up to 10 MB
            </p>
            <Button className='mt-5 bg-violet-600 px-8 hover:bg-violet-700'>
              Upload CV
            </Button>
          </label>

          <div className='flex items-center gap-4 text-sm text-muted-foreground'>
            <div className='h-px flex-1 bg-border' />
            or
            <div className='h-px flex-1 bg-border' />
          </div>

          <Button variant='outline' size='lg' className='w-full rounded-2xl'>
            Fill in manually
          </Button>

          <Button size='lg' className='w-full rounded-2xl' disabled>
            Continue to dashboard
            <ArrowRight className='size-4' />
          </Button>
        </CardContent>
      </Card>

      <p className='mt-6 text-sm text-muted-foreground'>
        You can update your profile anytime.
      </p>
    </main>
  )
}
