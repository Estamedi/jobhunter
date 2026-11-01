import { createFileRoute, redirect } from '@tanstack/react-router'
import { SettingsAiProvider } from '@/features/settings/ai-provider'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/settings/ai-provider')({
  beforeLoad: () => {
    const role = useAuthStore.getState().auth.user?.role ?? []
    if (!role.some((r) => r.toLowerCase() === 'administrator')) {
      throw redirect({ to: '/settings/password' })
    }
  },
  component: SettingsAiProvider,
})
