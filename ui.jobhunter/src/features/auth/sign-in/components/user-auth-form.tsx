import { useEffect, useState } from 'react'
import { z } from 'zod'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import i18n from '@/i18n'
import { Loader2, LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { IconGoogle } from '@/assets/brand-icons'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { authApi } from '@/features/auth/api'
import { EmbeddedBrowserNotice } from '@/features/auth/embedded-browser-notice'
import {
  getGoogleIdToken,
  preloadGoogleIdentity,
} from '@/features/auth/google-identity'

const formSchema = z.object({
  email: z.email({
    error: (iss) =>
      iss.input === '' ? i18n.t('Please enter your email.') : undefined,
  }),
  password: z
    .string()
    .min(1, { error: () => i18n.t('Please enter your password.') })
    .min(7, {
      error: () => i18n.t('Password must be at least 7 characters long.'),
    }),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  useEffect(() => {
    preloadGoogleIdentity()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  })

  async function loadCurrentUser(fallbackEmail: string) {
    try {
      const me = await authApi.me()
      auth.setUser({
        accountNo: me.id,
        email: me.email,
        role: me.roles,
        exp: 0,
        onboardingStatus: me.onboardingStatus,
        hasPassword: me.hasPassword,
      })
    } catch {
      auth.setUser({
        accountNo: '',
        email: fallbackEmail,
        role: [],
        exp: 0,
        onboardingStatus: 'Pending',
        hasPassword: false,
      })
    }
  }

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/Users/login?useCookies=false&useSessionCookies=false`,
        { email: data.email, password: data.password },
        { headers: { 'Content-Type': 'application/json' } }
      )
      const { accessToken } = res.data as {
        accessToken: string
        tokenType: string
      }
      auth.setAccessToken(accessToken)
      await loadCurrentUser(data.email)
      toast.success(t('Welcome back, {{email}}!', { email: data.email }))
      navigate({ to: redirectTo || '/', replace: true })
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? (err.response?.data as { detail?: string } | undefined)?.detail
        : undefined
      if (detail === 'NotAllowed') {
        // Identity refuses sign-in until the email is confirmed; send them to the resend screen.
        toast.error(
          t('Please confirm your email first. We sent a link to {{email}}.', {
            email: data.email,
          })
        )
        navigate({
          to: '/register-complete',
          search: { email: data.email },
          replace: true,
        })
      } else if (detail === 'LockedOut') {
        toast.error(t('Too many attempts. Please try again later.'))
      } else if (axios.isAxiosError(err) && err.response?.status === 401) {
        toast.error(t('Invalid email or password.'))
      } else {
        toast.error(t('Failed to sign in. Please try again.'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function onGoogleSignIn() {
    setIsGoogleLoading(true)

    try {
      const idToken = await getGoogleIdToken()

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/Users/google-login`,
        { idToken },
        { headers: { 'Content-Type': 'application/json' } }
      )
      const { accessToken } = res.data as {
        accessToken: string
        tokenType: string
      }

      auth.setAccessToken(accessToken)
      await loadCurrentUser('')
      toast.success(t('Signed in with Google.'))
      navigate({ to: redirectTo || '/', replace: true })
    } catch (err) {
      // Google errors (blocked or cancelled popup) carry a translated reason; server errors do not.
      toast.error(
        !axios.isAxiosError(err) && err instanceof Error && err.message
          ? err.message
          : t('Failed to sign in with Google. Please try again.')
      )
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <EmbeddedBrowserNotice />
        <Button
          variant='outline'
          type='button'
          // Google brand button: fixed colors per theme so it never inherits the green theme accent.
          className='mx-auto h-14 w-full max-w-xs rounded-2xl border-2 border-[#747775] bg-white text-base font-bold text-[#1F1F1F] shadow-md hover:bg-[#F2F2F2] hover:text-[#1F1F1F] dark:border-[#8E918F] dark:bg-[#131314] dark:text-[#E3E3E3] dark:hover:bg-[#1f1f21] dark:hover:text-[#E3E3E3]'
          disabled={isLoading || isGoogleLoading}
          onClick={onGoogleSignIn}
        >
          {isGoogleLoading ? (
            <Loader2 className='animate-spin' />
          ) : (
            <IconGoogle className='h-4 w-4' />
          )}
          {t('Continue with Google')}
        </Button>

        <div className='relative my-2'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background px-2 text-muted-foreground'>
              {t('Or sign in with email')}
            </span>
          </div>
        </div>

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Email')}</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Password')}</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='flex justify-end'>
          <Link
            to='/forgot-password'
            className='text-sm underline underline-offset-4 hover:text-primary'
          >
            {t('Forgot password?')}
          </Link>
        </div>
        <Button className='mt-2' data-primary-action disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          {t('Sign in')}
        </Button>
      </form>
    </Form>
  )
}
