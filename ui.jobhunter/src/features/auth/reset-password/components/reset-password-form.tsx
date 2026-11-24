import { useState } from 'react'
import { z } from 'zod'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import { PasswordInput } from '@/components/password-input'
import i18n from '@/i18n'
import { getAuthErrorMessage } from '@/features/auth/lib/auth-error'

const formSchema = z
  .object({
    password: z
      .string()
      .min(1, { error: () => i18n.t('Please enter a new password.') })
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

interface ResetPasswordFormProps extends React.HTMLAttributes<HTMLFormElement> {
  email: string
  code: string
}

export function ResetPasswordForm({
  email,
  code,
  className,
  ...props
}: ResetPasswordFormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/Users/resetPassword`,
        { email, resetCode: code, newPassword: data.password },
        { headers: { 'Content-Type': 'application/json' } }
      )
      toast.success(t('Your password has been changed. Please sign in.'))
      navigate({ to: '/sign-in', replace: true })
    } catch (err) {
      toast.error(
        getAuthErrorMessage(
          err,
          t(
            'Could not reset your password. The link may have expired; request a new one.'
          )
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-2', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('New password')}</FormLabel>
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
              <FormLabel>{t('Confirm new password')}</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading && <Loader2 className='animate-spin' />}
          {t('Change password')}
        </Button>
      </form>
    </Form>
  )
}
