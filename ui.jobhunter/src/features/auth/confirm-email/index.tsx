import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { ConfirmEmailStatus } from './components/confirm-email-status'

export function ConfirmEmail() {
  const { t } = useTranslation()
  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4 sm:min-w-sm'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            {t('Confirm your email')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ConfirmEmailStatus />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
