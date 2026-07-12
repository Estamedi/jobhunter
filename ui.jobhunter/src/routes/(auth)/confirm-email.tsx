import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { ConfirmEmail } from '@/features/auth/confirm-email'

const searchSchema = z.object({
  userId: z.string().optional(),
  code: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/confirm-email')({
  component: ConfirmEmail,
  validateSearch: searchSchema,
})
