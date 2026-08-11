import { useState } from 'react'
import { z } from 'zod'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { IconGmail } from '@/assets/brand-icons'
import { authApi } from '@/features/auth/api'
import { getGoogleIdToken } from '@/features/auth/google-identity'
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

const formSchema = z
  .object({
    email: z.email({
      error: (iss) =>
        iss.input === '' ? 'Please enter your email.' : undefined,
    }),
    password: z
      .string()
      .min(1, 'Please enter your password.')
      .min(7, 'Password must be at least 7 characters long.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })

interface ErrorResponse {
  title?: string
  detail?: string
  errors?: Record<string, string | string[] | undefined>
}

function getAuthErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ErrorResponse | undefined
    const firstError = data?.errors
      ? Object.values(data.errors)
          .flatMap((messages) =>
            Array.isArray(messages) ? messages : [messages]
          )
          .find(Boolean)
      : undefined

    return firstError ?? data?.detail ?? data?.title ?? fallback
  }

  if (err instanceof Error) {
    return err.message
  }

  return fallback
}

export function SignUpForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

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

      toast.success(`Account created for ${data.email}.`)
      navigate({
        to: '/register-complete',
        search: { email: data.email },
        replace: true,
      })
    } catch (err) {
      toast.error(
        getAuthErrorMessage(err, 'Failed to create account. Please try again.')
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
      toast.success('Signed up with Google.')
      navigate({ to: '/', replace: true })
    } catch {
      toast.error('Failed to sign up with Google. Please try again.')
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
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
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
              <FormLabel>Password</FormLabel>
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
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <UserPlus />}
          Create Account
        </Button>

        <div className='relative my-2'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background px-2 text-muted-foreground'>
              Or continue with
            </span>
          </div>
        </div>

        <Button
          variant='outline'
          type='button'
          disabled={isLoading || isGoogleLoading}
          onClick={onGoogleSignUp}
        >
          {isGoogleLoading ? (
            <Loader2 className='animate-spin' />
          ) : (
            <IconGmail className='h-4 w-4' />
          )}
          Continue with Google
        </Button>
      </form>
    </Form>
  )
}
