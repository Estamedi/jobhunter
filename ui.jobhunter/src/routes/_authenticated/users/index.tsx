import { createFileRoute, redirect } from '@tanstack/react-router'
import { Users } from '@/features/users'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/users/')({
  beforeLoad: () => {
    const role = useAuthStore.getState().auth.user?.role ?? []
    if (!role.some((r) => r.toLowerCase() === 'administrator')) {
      throw redirect({ to: '/' })
    }
  },
  component: Users,
})
