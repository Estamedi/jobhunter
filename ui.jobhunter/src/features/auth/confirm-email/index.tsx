import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { ConfirmEmailStatus } from './components/confirm-email-status'

export function ConfirmEmail() {
  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4 sm:min-w-sm'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Confirm your email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ConfirmEmailStatus />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
