import { Link, useSearch } from '@tanstack/react-router'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { ResetPasswordForm } from './components/reset-password-form'

export function ResetPassword() {
  const { email, code } = useSearch({ from: '/(auth)/reset-password' })

  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4 sm:min-w-sm'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Choose a new password
          </CardTitle>
          {email && code && (
            <CardDescription>
              For <strong>{email}</strong>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {email && code ? (
            <ResetPasswordForm email={email} code={code} />
          ) : (
            <div className='flex flex-col items-center gap-3 py-2 text-center'>
              <XCircle className='size-8 text-destructive' />
              <p className='text-sm text-muted-foreground'>
                This reset link is incomplete. Request a new one to continue.
              </p>
              <Button asChild className='mt-2 w-full'>
                <Link to='/forgot-password'>Request a new link</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
