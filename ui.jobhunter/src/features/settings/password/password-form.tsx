import { useState } from 'react'
import { z } from 'zod'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/features/auth/api'
import { useAuthStore } from '@/stores/auth-store'
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

interface ErrorResponse {
  title?: string
  detail?: string
  errors?: Record<string, string | string[] | undefined>
}

function getPasswordErrorMessage(err: unknown, fallback: string) {
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

  return fallback
}

const newPasswordSchema = z
  .string()
  .min(1, 'Please enter a password.')
  .min(7, 'Password must be at least 7 characters long.')

function buildFormSchema(hasPassword: boolean) {
  return z
    .object({
      oldPassword: hasPassword
        ? z.string().min(1, 'Please enter your current password.')
        : z.string().optional(),
      newPassword: newPasswordSchema,
      confirmPassword: z.string().min(1, 'Please confirm your password.'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match.",
      path: ['confirmPassword'],
    })
}

export function PasswordForm() {
  const { auth } = useAuthStore()
  const hasPassword = auth.user?.hasPassword ?? false
  const [isLoading, setIsLoading] = useState(false)

  const formSchema = buildFormSchema(hasPassword)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      await authApi.setPassword(data.newPassword, hasPassword ? data.oldPassword : undefined)
      auth.setHasPassword(true)
      form.reset({ oldPassword: '', newPassword: '', confirmPassword: '' })
      toast.success(
        hasPassword
          ? 'Password updated.'
          : 'Password set. You can now sign in with your email and password.'
      )
    } catch (err) {
      toast.error(
        getPasswordErrorMessage(err, 'Failed to update password. Please try again.')
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        {hasPassword && (
          <FormField
            control={form.control}
            name='oldPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder='********' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name='newPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
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
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={isLoading}>
          {isLoading && <Loader2 className='animate-spin' />}
          {hasPassword ? 'Update password' : 'Set password'}
        </Button>
      </form>
    </Form>
  )
}
