import { Link, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { ResendConfirmationEmail } from './components/resend-confirmation-email'

export function RegisterComplete() {
  const { t } = useTranslation()
  const { email } = useSearch({ from: '/(auth)/register-complete' })

  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4 sm:min-w-sm'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            {t('Check your email')}
          </CardTitle>
          <CardDescription>
            {email ? (
              <>
                {t('We sent a confirmation link to')} <strong>{email}</strong>.{' '}
                {t('Click the link to confirm your account and continue.')}
              </>
            ) : (
              t(
                'We sent you a confirmation link. Click the link to confirm your account and continue.'
              )
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResendConfirmationEmail email={email} />
        </CardContent>
        <CardFooter>
          <p className='mx-auto px-8 text-center text-sm text-balance text-muted-foreground'>
            {t('Already confirmed?')}{' '}
            <Link
              to='/sign-in'
              className='underline underline-offset-4 hover:text-primary'
            >
              {t('Sign in')}
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
