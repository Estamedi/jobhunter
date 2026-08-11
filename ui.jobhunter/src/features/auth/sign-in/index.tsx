import { Link, useSearch } from '@tanstack/react-router'
import { Check, Circle, LogIn, Upload, UserRoundCheck } from 'lucide-react'
import { Logo } from '@/assets/logo'
import { UserAuthForm } from './components/user-auth-form'

const pipelineSteps = [
  {
    title: 'Sign in',
    description: 'Access your workspace',
    status: 'current',
    icon: LogIn,
  },
  {
    title: 'Upload CV',
    description: 'We extract your profile details',
    status: 'next',
    icon: Upload,
  },
  {
    title: 'Start applying',
    description: 'Track jobs from your dashboard',
    status: 'next',
    icon: UserRoundCheck,
  },
]

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <main className='min-h-svh bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8'>
      <div className='mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]'>
        <section className='relative hidden overflow-hidden rounded-[2rem] border border-border bg-card/55 p-8 shadow-sm backdrop-blur lg:block'>
          <div className='absolute -top-20 -left-16 size-64 rounded-full bg-primary/30 blur-3xl' />
          <div className='absolute -right-24 bottom-0 size-72 rounded-full bg-foreground/20 blur-3xl' />

          <div className='relative space-y-10'>
            <div className='flex items-center gap-3'>
              <Logo className='size-9' />
              <span className='text-xl font-bold'>Job Hunter CRM</span>
            </div>

            <div className='space-y-4'>
              <h1 className='max-w-xl text-5xl font-black tracking-tight text-balance'>
                Continue your job search
              </h1>
              <p className='max-w-lg text-lg leading-8 text-muted-foreground'>
                Sign in to upload your CV, complete your profile, and start
                applying for jobs with everything organized in one place.
              </p>
            </div>

            <div className='grid max-w-lg gap-3'>
              {pipelineSteps.map((step, index) => {
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
                <p className='text-2xl font-black'>3x</p>
                <p className='mt-1 text-xs text-accent'>
                  faster profile setup
                </p>
              </div>
              <div className='rounded-2xl border border-border bg-card/80 p-4'>
                <p className='text-2xl font-black'>1</p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  job search workspace
                </p>
              </div>
              <div className='rounded-2xl border border-border bg-card/80 p-4'>
                <p className='text-2xl font-black'>CV</p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  import supported
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className='mx-auto w-full max-w-md'>
          <div className='mb-6 flex items-center justify-center gap-3 lg:hidden'>
            <Logo className='size-9' />
            <span className='text-xl font-bold'>Job Hunter CRM</span>
          </div>

          <div className='rounded-[2rem] border border-border bg-card shadow-lg shadow-border/70 dark:shadow-none'>
            <div className='px-7 pt-7 pb-5'>
              <h2 className='text-3xl font-black tracking-tight'>
                Welcome back
              </h2>
              <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                Sign in to continue. No account?{' '}
                <Link
                  to='/sign-up'
                  className='font-semibold text-primary underline-offset-4 hover:underline'
                >
                  Sign up
                </Link>
              </p>
            </div>

            <div className='space-y-5 px-7 pb-7'>
              <UserAuthForm
                redirectTo={redirect}
                className='[&_input]:h-12 [&_input]:rounded-2xl [&_input]:border-border [&_input]:bg-background [&>button]:mx-auto [&>button]:mt-3 [&>button]:h-12 [&>button]:w-full [&>button]:max-w-xs [&>button]:rounded-2xl [&>button]:bg-primary [&>button]:text-base [&>button]:font-bold [&>button]:shadow-lg [&>button]:shadow-primary/20 [&>button:hover]:bg-primary/90'
              />

              <div className='rounded-2xl bg-accent px-4 py-3 dark:bg-primary/20'>
                <div className='flex gap-3 text-sm text-muted-foreground'>
                  <Check className='mt-0.5 size-4 shrink-0 text-primary' />
                  After signing in, we'll guide you through completing your
                  profile.
                </div>
              </div>

              <p className='text-center text-xs leading-5 text-muted-foreground'>
                By signing in, you agree to our{' '}
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
