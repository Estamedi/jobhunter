import { isAxiosError } from 'axios'

// The server explains AI failures in the problem details "detail" (for example "The AI service is busy
// or over its quota"). Show that when it is there, and the generic text otherwise.
export function serverDetail(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.length > 0) return detail
  }
  return fallback
}
