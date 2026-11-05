import axios from 'axios'
import { getApiErrorMessage } from '@/lib/api-error'
import { getCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'thisisjustarandomstring'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// The signed-in user's access token, or an empty string when there is none.
export function getAccessToken(): string {
  const raw = getCookie(ACCESS_TOKEN)
  return raw ? (JSON.parse(raw) as string) || '' : ''
}

http.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// A 400 from the server lists why it failed (field by field). Put the first reason in the error's message
// so every catch block and toast can show it instead of "Request failed with status code 400".
http.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 400) {
    error.message = getApiErrorMessage(error, error.message)
  }
  return Promise.reject(error)
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
