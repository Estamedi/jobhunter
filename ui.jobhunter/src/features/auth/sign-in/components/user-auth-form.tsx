import { useState } from 'react'
import { z } from 'zod'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { IconGmail } from '@/assets/brand-icons'
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

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? 'Please enter your email.' : undefined),
  }),
  password: z
    .string()
    .min(1, 'Please enter your password.')
    .min(7, 'Password must be at least 7 characters long.'),
})

interface GoogleTokenResponse {
  access_token?: string
}

interface GoogleAccountsOauth2 {
  initTokenClient: (options: {
    client_id: string
    scope: string
    callback: (response: GoogleTokenResponse) => void
  }) => {
    requestAccessToken: () => void
  }
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleAccountsOauth2
      }
    }
  }
}

function loadGoogleIdentityScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve()
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    )

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject()
    document.head.appendChild(script)
  })
}

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  })

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
      auth.setUser({ accountNo: '', email: data.email, role: ['user'], exp: 0 })
      auth.setAccessToken(accessToken)
      toast.success(`Welcome back, ${data.email}!`)
      navigate({ to: redirectTo || '/onboarding', replace: true })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        toast.error('Invalid email or password.')
      } else {
        toast.error('Failed to sign in. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function getGoogleIdToken() {
    const configuredToken = import.meta.env.VITE_GOOGLE_ID_TOKEN as
      | string
      | undefined

    if (configuredToken) {
      return configuredToken
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

    if (!clientId) {
      throw new Error('Google client id is not configured.')
    }

    await loadGoogleIdentityScript()

    return new Promise<string>((resolve, reject) => {
      const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: (response) => {
          if (response.access_token) {
            resolve(response.access_token)
          } else {
            reject(new Error('Google did not return a token.'))
          }
        },
      })

      if (!tokenClient) {
        reject(new Error('Google sign-in is not available.'))
        return
      }

      tokenClient.requestAccessToken()
    })
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
      const { accessToken } = res.data as { accessToken: string; tokenType: string }

      auth.setUser({ accountNo: '', email: '', role: ['user'], exp: 0 })
      auth.setAccessToken(accessToken)
      toast.success('Signed in with Google.')
      navigate({ to: redirectTo || '/', replace: true })
    } catch {
      toast.error('Failed to sign in with Google. Please try again.')
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
        <div className='flex justify-end'>
          <Link
            to='/forgot-password'
            className='text-sm underline underline-offset-4 hover:text-primary'
          >
            Forgot password?
          </Link>
        </div>
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          Sign in
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
          onClick={onGoogleSignIn}
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
