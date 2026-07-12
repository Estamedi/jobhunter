import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { RegisterComplete } from '@/features/auth/register-complete'

const searchSchema = z.object({
  email: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/register-complete')({
  component: RegisterComplete,
  validateSearch: searchSchema,
})
