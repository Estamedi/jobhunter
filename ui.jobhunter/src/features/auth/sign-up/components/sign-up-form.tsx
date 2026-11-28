import { useEffect, useState } from 'react'
import { z } from 'zod'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import i18n from '@/i18n'
import { Loader2, UserPlus } from 'lucide-react'
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
import { getAuthErrorMessage } from '@/features/auth/lib/auth-error'

const formSchema = z
  .object({
    email: z.email({
      error: (iss) =>
        iss.input === '' ? i18n.t('Please enter your email.') : undefined,
    }),
    password: z
      .string()
      .min(1, { error: () => i18n.t('Please enter your password.') })
      .min(10, {
        error: () => i18n.t('Password must be at least 10 characters long.'),
      }),
    confirmPassword: z
      .string()
      .min(1, { error: () => i18n.t('Please confirm your password.') }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: () => i18n.t("Passwords don't match."),
    path: ['confirmPassword'],
  })

export function SignUpForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
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
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/Users/register`,
        { email: data.email, password: data.password },
        { headers: { 'Content-Type': 'application/json' } }
      )

      toast.success(t('Account created for {{email}}.', { email: data.email }))
      navigate({
        to: '/register-complete',
        search: { email: data.email },
        replace: true,
      })
    } catch (err) {
      toast.error(
        getAuthErrorMessage(
          err,
          t('Failed to create account. Please try again.')
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

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

  async function onGoogleSignUp() {
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
      toast.success(t('Signed up with Google.'))
      navigate({ to: '/', replace: true })
    } catch (err) {
      // Google errors (blocked or cancelled popup) carry a translated reason; server errors do not.
      toast.error(
        !axios.isAxiosError(err) && err instanceof Error && err.message
          ? err.message
          : t('Failed to sign up with Google. Please try again.')
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
          onClick={onGoogleSignUp}
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
              {t('Or sign up with email')}
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
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Confirm Password')}</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' data-primary-action disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <UserPlus />}
          {t('Create Account')}
        </Button>
      </form>
    </Form>
  )
}
