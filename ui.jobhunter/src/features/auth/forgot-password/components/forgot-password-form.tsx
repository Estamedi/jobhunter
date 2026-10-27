import { useState } from 'react'
import { z } from 'zod'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Loader2, MailCheck } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { getAuthErrorMessage } from '@/features/auth/lib/auth-error'

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? 'Please enter your email.' : undefined),
  }),
})

export function ForgotPasswordForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/Users/forgotPassword`,
        { email: data.email },
        { headers: { 'Content-Type': 'application/json' } }
      )
      form.reset()
      setSentTo(data.email)
    } catch (err) {
      toast.error(
        getAuthErrorMessage(err, 'Could not send the email. Please try again.')
      )
    } finally {
      setIsLoading(false)
    }
  }

  // The server answers the same whether or not the address has an account, so the message does too.
  if (sentTo) {
    return (
      <div className='flex flex-col items-center gap-3 py-2 text-center'>
        <MailCheck className='size-8 text-green-600' />
        <p className='text-sm text-muted-foreground'>
          If an account exists for <strong>{sentTo}</strong>, we sent a link to
          reset your password. It can take a minute to arrive.
        </p>
        <Button asChild variant='outline' className='mt-2 w-full'>
          <Link to='/sign-in'>Back to sign in</Link>
        </Button>
      </div>
    )
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
        <Button className='mt-2' disabled={isLoading}>
          Continue
          {isLoading ? <Loader2 className='animate-spin' /> : <ArrowRight />}
        </Button>
      </form>
    </Form>
  )
}
