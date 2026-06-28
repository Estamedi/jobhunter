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
