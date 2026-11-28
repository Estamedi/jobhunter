import { isAxiosError } from 'axios'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { getCookie } from '@/lib/cookies'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { authApi } from '@/features/auth/api'

const ACCESS_TOKEN = 'thisisjustarandomstring'
const ME_RETRY_DELAYS_MS = [500, 1500]

function isUnauthorized(error: unknown) {
  return isAxiosError(error) && error.response?.status === 401
}

async function loadCurrentUserWithRetry() {
  for (let attempt = 0; ; attempt++) {
    try {
      return await authApi.me()
    } catch (error) {
      if (isUnauthorized(error) || attempt >= ME_RETRY_DELAYS_MS.length) {
        throw error
      }
      await new Promise((resolve) =>
        setTimeout(resolve, ME_RETRY_DELAYS_MS[attempt])
      )
    }
  }
}

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
        const me = await loadCurrentUserWithRetry()
        auth.setUser({
          accountNo: me.id,
          email: me.email,
          role: me.roles,
          exp: 0,
          onboardingStatus: me.onboardingStatus,
          hasPassword: me.hasPassword,
        })
      } catch (error) {
        // Only a rejected token signs the user out. A network blip or server error (common when iOS
        // Safari resumes a suspended tab before the connection is back) keeps the token, so a reload
        // recovers the session instead of forcing a new sign-in.
        if (isUnauthorized(error)) {
          auth.reset()
          throw redirect({
            to: '/sign-in',
            search: { redirect: location.href },
          })
        }
        throw error
      }
    }

    const { user } = useAuthStore.getState().auth
    const needsOnboarding =
      !!user &&
      user.role.includes('JobSeeker') &&
      user.onboardingStatus === 'Pending'

    const onOnboardingRoute = location.pathname.startsWith('/onboarding')

    if (needsOnboarding && !onOnboardingRoute) {
      throw redirect({ to: '/onboarding', replace: true })
    }
  },
  component: AuthenticatedLayout,
})
