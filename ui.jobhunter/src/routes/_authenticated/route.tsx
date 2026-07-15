import { createFileRoute, redirect } from '@tanstack/react-router'
import { authApi } from '@/features/auth/api'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { getCookie } from '@/lib/cookies'
import { useAuthStore } from '@/stores/auth-store'

const ACCESS_TOKEN = 'thisisjustarandomstring'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const raw = getCookie(ACCESS_TOKEN)
    const token = raw ? (JSON.parse(raw) as string) : ''
    if (!token) {
      throw redirect({ to: '/sign-in', search: { redirect: location.href } })
    }

    const { auth } = useAuthStore.getState()
    if (!auth.user) {
      try {
        const me = await authApi.me()
        auth.setUser({
          accountNo: me.id,
          email: me.email,
          role: me.roles,
          exp: 0,
          onboardingStatus: me.onboardingStatus,
        })
      } catch {
        auth.reset()
        throw redirect({ to: '/sign-in', search: { redirect: location.href } })
      }
    }

    const { user } = useAuthStore.getState().auth
    const needsOnboarding =
      !!user &&
      user.role.includes('JobSeeker') &&
      user.onboardingStatus === 'Pending'

    const onOnboardingRoute =
      location.pathname === '/onboarding' || location.pathname === '/onboarding/'

    if (needsOnboarding && !onOnboardingRoute) {
      throw redirect({ to: '/onboarding', replace: true })
    }
  },
  component: AuthenticatedLayout,
})
