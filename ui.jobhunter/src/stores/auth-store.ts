import { create } from 'zustand'
import type { OnboardingStatus } from '@/features/auth/api'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'thisisjustarandomstring'

interface AuthUser {
  accountNo: string
  email: string
  role: string[]
  exp: number
  onboardingStatus: OnboardingStatus
  hasPassword: boolean
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    setOnboardingStatus: (status: OnboardingStatus) => void
    setHasPassword: (hasPassword: boolean) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()((set) => {
  const cookieState = getCookie(ACCESS_TOKEN)
  const initToken = cookieState ? JSON.parse(cookieState) : ''
  return {
    auth: {
      user: null,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      setOnboardingStatus: (status) =>
        set((state) => ({
          ...state,
          auth: {
            ...state.auth,
            user: state.auth.user ? { ...state.auth.user, onboardingStatus: status } : null,
          },
        })),
      setHasPassword: (hasPassword) =>
        set((state) => ({
          ...state,
          auth: {
            ...state.auth,
            user: state.auth.user ? { ...state.auth.user, hasPassword } : null,
          },
        })),
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          setCookie(ACCESS_TOKEN, JSON.stringify(accessToken))
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return {
            ...state,
            auth: { ...state.auth, user: null, accessToken: '' },
          }
        }),
    },
  }
})
