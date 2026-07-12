import { useEffect, useState } from 'react'
import axios from 'axios'
import { Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const RESEND_COOLDOWN_SECONDS = 120

interface ResendConfirmationEmailProps {
  email?: string
}

export function ResendConfirmationEmail({
  email,
}: ResendConfirmationEmailProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setInterval(() => {
      setCooldown((seconds) => Math.max(seconds - 1, 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown])

  async function handleResend() {
    if (!email) {
      toast.error('Missing email address.')
      return
    }

    setIsLoading(true)

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/Users/resendConfirmationEmail`,
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      )
      toast.success('Confirmation email sent.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch {
      toast.error('Failed to resend confirmation email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type='button'
      className='w-full'
      disabled={isLoading || cooldown > 0 || !email}
      onClick={handleResend}
    >
      {isLoading ? <Loader2 className='animate-spin' /> : <Mail />}
      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend confirmation email'}
    </Button>
  )
}
