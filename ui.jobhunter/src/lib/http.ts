import axios from 'axios'
import { getCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'thisisjustarandomstring'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const raw = getCookie(ACCESS_TOKEN)
  if (raw) {
    const token = JSON.parse(raw) as string
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Axios's default serializer emits array params as `key[]=a&key[]=b`, which ASP.NET Core
// minimal API query binding for string[] parameters does not recognize — it only matches
// repeated plain keys (`key=a&key=b`).
export function serializeQueryParams(params: Record<string, unknown>) {
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) {
      value.forEach((item) => usp.append(key, String(item)))
    } else {
      usp.append(key, String(value))
    }
  })
  return usp.toString()
}
