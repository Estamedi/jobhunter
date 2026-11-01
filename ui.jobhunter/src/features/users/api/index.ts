import { http } from '@/lib/http'

export interface RegisteredUser {
  id: string
  email: string
  roles: string[]
  onboardingStatus: string
  hasPassword: boolean
  usesGoogle: boolean
  emailConfirmed: boolean
  created: string | null
}

export interface RegisteredUsersResult {
  items: RegisteredUser[]
  total: number
  totalUsers: number
  newThisWeek: number
}

export const usersApi = {
  list: (filters: { search?: string; role?: string; page?: number; pageSize?: number } = {}) =>
    http.get<RegisteredUsersResult>('/api/Users', { params: filters }).then((r) => r.data),
}
