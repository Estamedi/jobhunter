import { createFileRoute } from '@tanstack/react-router'
import { OnboardingExtension } from '@/features/onboarding/extension'

export const Route = createFileRoute('/_authenticated/onboarding/extension')({
  component: OnboardingExtension,
})
