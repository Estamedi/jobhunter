import { http } from '@/lib/http'

export type OnboardingStatus = 'Pending' | 'Completed' | 'Skipped'

export interface CurrentUser {
  id: string
  email: string
  roles: string[]
  onboardingStatus: OnboardingStatus
}

export const authApi = {
  me: () => http.get<CurrentUser>('/api/Users/me').then((r) => r.data),

  updateOnboardingStatus: (status: Extract<OnboardingStatus, 'Completed' | 'Skipped'>) =>
    http.put('/api/Users/onboarding-status', { status }),
}
