import axios from 'axios'

interface ErrorResponse {
  title?: string
  detail?: string
  errors?: Record<string, string | string[] | undefined>
}

// The first message the server gave for a failed auth request: Identity's validation errors (for
// example a weak password or an expired reset link), else the problem title, else the fallback.
export function getAuthErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ErrorResponse | undefined
    const firstError = data?.errors
      ? Object.values(data.errors)
          .flatMap((messages) =>
            Array.isArray(messages) ? messages : [messages]
          )
          .find(Boolean)
      : undefined

    return firstError ?? data?.detail ?? data?.title ?? fallback
  }

  if (err instanceof Error) {
    return err.message
  }

  return fallback
}
