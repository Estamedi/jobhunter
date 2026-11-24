import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useSearch } from '@tanstack/react-router'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

type Status = 'loading' | 'success' | 'error'

export function ConfirmEmailStatus() {
  const { t } = useTranslation()
  const { userId, code } = useSearch({ from: '/(auth)/confirm-email' })
  const hasParams = Boolean(userId && code)
  const [status, setStatus] = useState<Status>(hasParams ? 'loading' : 'error')

  useEffect(() => {
    if (!hasParams) return

    let cancelled = false

    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/api/Users/confirmEmail`, {
        params: { userId, code },
      })
      .then(() => {
        if (!cancelled) setStatus('success')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [userId, code, hasParams])

  if (status === 'loading') {
    return (
      <div className='flex flex-col items-center gap-3 py-4 text-sm text-muted-foreground'>
        <Loader2 className='size-6 animate-spin' />
        {t('Confirming your email...')}
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className='flex flex-col items-center gap-3 py-4 text-center'>
        <CheckCircle2 className='size-8 text-green-600' />
        <p className='text-sm text-muted-foreground'>
          {t('Your email has been confirmed.')}
        </p>
        <Button asChild className='mt-2 w-full'>
          <Link to='/sign-in'>{t('Continue to Sign in')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='flex flex-col items-center gap-3 py-4 text-center'>
      <XCircle className='size-8 text-destructive' />
      <p className='text-sm text-muted-foreground'>
        {t('We could not confirm your email. The link may be invalid or expired.')}
      </p>
      <Button asChild variant='outline' className='mt-2 w-full'>
        <Link to='/sign-in'>{t('Return to Sign in')}</Link>
      </Button>
    </div>
  )
}
