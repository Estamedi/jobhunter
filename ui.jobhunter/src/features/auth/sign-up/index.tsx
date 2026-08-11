import { Link } from '@tanstack/react-router'
import { Check, Circle, FileText, LogIn, UserPlus } from 'lucide-react'
import { Logo } from '@/assets/logo'
import { SignUpForm } from './components/sign-up-form'

const setupSteps = [
  {
    title: 'Create account',
    description: 'Secure your job-search workspace',
    status: 'current',
    icon: UserPlus,
  },
  {
    title: 'Upload CV',
    description: 'Build your profile faster',
    status: 'next',
    icon: FileText,
  },
  {
    title: 'Sign in anytime',
    description: 'Return to applications and follow-ups',
    status: 'next',
    icon: LogIn,
  },
]

export function SignUp() {
  return (
    <main className='min-h-svh bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8'>
      <div className='mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_460px]'>
        <section className='relative hidden overflow-hidden rounded-[2rem] border border-border bg-card/55 p-8 shadow-sm backdrop-blur lg:block'>
          <div className='absolute -top-20 -left-16 size-64 rounded-full bg-primary/30 blur-3xl' />
          <div className='absolute -right-24 bottom-0 size-72 rounded-full bg-foreground/20 blur-3xl' />

          <div className='relative space-y-10'>
            <a href='https://tapinti.com' className='flex w-fit items-center gap-3'>
              <Logo className='size-9' />
              <span className='text-xl font-bold'>Job Hunter CRM</span>
            </a>

            <div className='space-y-4'>
              <h1 className='max-w-xl text-5xl font-black tracking-tight text-balance'>
                Start your job search workspace
              </h1>
              <p className='max-w-lg text-lg leading-8 text-muted-foreground'>
                Create an account, upload your CV, and keep every application,
                company, interview, and follow-up organized from day one.
              </p>
            </div>

            <div className='grid max-w-lg gap-3'>
              {setupSteps.map((step, index) => {
                const Icon = step.icon
                const isCurrent = step.status === 'current'

                return (
                  <div
                    key={step.title}
                    className='flex items-center gap-4 rounded-2xl border border-border bg-card/80 px-4 py-3 shadow-xs'
                  >
                    <div
                      className={
                        isCurrent
                          ? 'flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white'
                          : 'flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground'
                      }
                    >
                      {index === 0 ? (
                        <Check className='size-5' />
                      ) : (
                        <Circle className='size-4' />
                      )}
                    </div>
                    <Icon className='size-5 shrink-0 text-primary' />
                    <div className='min-w-0'>
                      <p className='text-sm font-bold'>{step.title}</p>
                      <p className='text-xs text-muted-foreground'>
                        {step.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className='grid max-w-lg grid-cols-3 gap-3'>
              <div className='rounded-2xl bg-primary p-4 text-white'>
                <p className='text-2xl font-black'>CV</p>
                <p className='mt-1 text-xs text-accent'>profile import</p>
              </div>
              <div className='rounded-2xl border border-border bg-card/80 p-4'>
                <p className='text-2xl font-black'>All</p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  applications tracked
                </p>
              </div>
              <div className='rounded-2xl border border-border bg-card/80 p-4'>
                <p className='text-2xl font-black'>1</p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  focused dashboard
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className='mx-auto w-full max-w-md'>
          <a
            href='https://tapinti.com'
            className='mb-6 flex items-center justify-center gap-3 lg:hidden'
          >
            <Logo className='size-9' />
            <span className='text-xl font-bold'>Job Hunter CRM</span>
          </a>

          <div className='rounded-[2rem] border border-border bg-card shadow-lg shadow-border/70 dark:shadow-none'>
            <div className='px-7 pt-7 pb-5'>
              <h2 className='text-3xl font-black tracking-tight'>
                Create account
              </h2>
              <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                Already have an account?{' '}
                <Link
                  to='/sign-in'
                  className='font-semibold text-primary underline-offset-4 hover:underline'
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div className='space-y-5 px-7 pb-7'>
              <SignUpForm className='[&_input]:h-12 [&_input]:rounded-2xl [&_input]:border-border [&_input]:bg-background [&>button:first-of-type]:mx-auto [&>button:first-of-type]:mt-3 [&>button:first-of-type]:h-12 [&>button:first-of-type]:w-full [&>button:first-of-type]:max-w-xs [&>button:first-of-type]:rounded-2xl [&>button:first-of-type]:bg-primary [&>button:first-of-type]:text-base [&>button:first-of-type]:font-bold [&>button:first-of-type]:shadow-lg [&>button:first-of-type]:shadow-primary/20 [&>button:first-of-type:hover]:bg-primary/90' />

              <div className='rounded-2xl bg-accent px-4 py-3 dark:bg-primary/20'>
                <div className='flex gap-3 text-sm text-muted-foreground'>
                  <Check className='mt-0.5 size-4 shrink-0 text-primary' />
                  After creating your account, upload your CV to complete your
                  profile faster.
                </div>
              </div>

              <p className='text-center text-xs leading-5 text-muted-foreground'>
                By creating an account, you agree to our{' '}
                <a
                  href='/terms'
                  className='underline underline-offset-4 hover:text-primary'
                >
                  Terms
                </a>{' '}
                and{' '}
                <a
                  href='/privacy'
                  className='underline underline-offset-4 hover:text-primary'
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
