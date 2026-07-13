import { http } from '@/lib/http'

export interface CurrentUser {
  id: string
  email: string
  roles: string[]
}

export const authApi = {
  me: () => http.get<CurrentUser>('/api/Users/me').then((r) => r.data),
}
