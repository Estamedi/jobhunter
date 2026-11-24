import { Link, useSearch } from '@tanstack/react-router'
import { Trans, useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Check,
  Circle,
  LogIn,
  Upload,
  UserRoundCheck,
} from 'lucide-react'
import { Logo } from '@/assets/logo'
import { LanguageSwitch } from '@/components/language-switch'
import { CvRewriteScene } from '../cv-rewrite-scene'
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
  const { t } = useTranslation()
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <main className='relative min-h-svh bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8'>
      <div className='absolute end-4 top-4 z-10'>
        <LanguageSwitch />
      </div>
      <div className='mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]'>
        <section className='relative hidden overflow-hidden rounded-[2rem] border border-border bg-card/55 p-8 shadow-sm backdrop-blur lg:block'>
          <div className='absolute -top-20 -left-16 size-64 rounded-full bg-primary/30 blur-3xl' />
          <div className='absolute -right-24 bottom-0 size-72 rounded-full bg-foreground/20 blur-3xl' />

          <div className='relative space-y-8'>
            <a
              href='https://applyladder.com'
              className='flex w-fit items-center gap-3'
            >
              <Logo className='size-9' />
              <span className='text-xl font-bold'>{t('Job Hunter CRM')}</span>
            </a>

            <div className='space-y-4'>
              <h1 className='max-w-xl text-5xl font-black tracking-tight text-balance'>
                {t('Continue your job search')}
              </h1>
              <p className='max-w-lg text-lg leading-8 text-muted-foreground'>
                {t(
                  'Sign in to upload your CV, complete your profile, and start applying for jobs with everything organized in one place.'
                )}
              </p>
            </div>

            <CvRewriteScene className='h-auto w-full max-w-lg' />

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
                      <p className='text-sm font-bold'>{t(step.title)}</p>
                      <p className='text-xs text-muted-foreground'>
                        {t(step.description)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className='grid max-w-lg grid-cols-3 gap-3'>
              <div className='rounded-2xl bg-primary p-4 text-white'>
                <p className='text-2xl font-black'>3x</p>
                <p className='mt-1 text-xs text-accent'>{t('faster profile setup')}</p>
              </div>
              <div className='rounded-2xl border border-border bg-card/80 p-4'>
                <p className='text-2xl font-black'>1</p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {t('job search workspace')}
                </p>
              </div>
              <div className='rounded-2xl border border-border bg-card/80 p-4'>
                <p className='text-2xl font-black'>CV</p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {t('import supported')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className='mx-auto w-full max-w-md'>
          <div className='mb-6 flex items-center justify-between text-sm font-semibold'>
            <a
              href='https://applyladder.com'
              className='inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary'
            >
              <ArrowLeft className='size-4 rtl:rotate-180' />
              {t('Back to website')}
            </a>
            <a
              href='https://applyladder.com/#pricing'
              className='text-muted-foreground hover:text-primary'
            >
              {t('Pricing')}
            </a>
          </div>

          <a
            href='https://applyladder.com'
            className='mb-6 flex items-center justify-center gap-3 lg:hidden'
          >
            <Logo className='size-9' />
            <span className='text-xl font-bold'>{t('Job Hunter CRM')}</span>
          </a>

          <div className='rounded-[2rem] border border-border bg-card shadow-lg shadow-border/70 dark:shadow-none'>
            <div className='px-7 pt-7 pb-5'>
              <h2 className='text-3xl font-black tracking-tight'>
                {t('Welcome back')}
              </h2>
              <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                {t('Sign in to continue. No account?')}{' '}
                <Link
                  to='/sign-up'
                  className='font-semibold text-primary underline-offset-4 hover:underline'
                >
                  {t('Sign up')}
                </Link>
              </p>
            </div>

            <div className='space-y-5 px-7 pb-7'>
              <UserAuthForm
                redirectTo={redirect}
                className='[&_input]:h-12 [&_input]:rounded-2xl [&_input]:border-border [&_input]:bg-background [&>[data-primary-action]]:mx-auto [&>[data-primary-action]]:mt-3 [&>[data-primary-action]]:h-12 [&>[data-primary-action]]:w-full [&>[data-primary-action]]:max-w-xs [&>[data-primary-action]]:rounded-2xl [&>[data-primary-action]]:border [&>[data-primary-action]]:border-primary/40 [&>[data-primary-action]]:bg-transparent [&>[data-primary-action]]:text-base [&>[data-primary-action]]:font-bold [&>[data-primary-action]]:text-primary [&>[data-primary-action]:hover]:bg-primary/10'
              />

              <div className='rounded-2xl bg-accent px-4 py-3 dark:bg-primary/20'>
                <div className='flex gap-3 text-sm text-muted-foreground'>
                  <Check className='mt-0.5 size-4 shrink-0 text-primary' />
                  {t(
                    "After signing in, we'll guide you through completing your profile."
                  )}
                </div>
              </div>

              <p className='text-center text-xs leading-5 text-muted-foreground'>
                <Trans
                  i18nKey='By signing in, you agree to our <terms>Terms</terms> and <privacy>Privacy Policy</privacy>.'
                  defaults='By signing in, you agree to our <terms>Terms</terms> and <privacy>Privacy Policy</privacy>.'
                  components={{
                    terms: (
                      <a
                        href='/terms'
                        className='underline underline-offset-4 hover:text-primary'
                      />
                    ),
                    privacy: (
                      <a
                        href='/privacy'
                        className='underline underline-offset-4 hover:text-primary'
                      />
                    ),
                  }}
                />
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
