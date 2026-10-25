import { createFileRoute } from '@tanstack/react-router'
import { OnboardingQuestions } from '@/features/onboarding/questions'

export const Route = createFileRoute('/_authenticated/onboarding/questions')({
  component: OnboardingQuestions,
})
