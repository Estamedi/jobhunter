import axios from 'axios'

interface ProblemDetails {
  title?: string
  detail?: string
  errors?: Record<string, string | string[] | undefined>
}

// "Experiences[0].Description" -> "Experience 1 description"
function fieldLabel(key: string) {
  const parts = key.split('.').map((part) => {
    const match = /^([A-Za-z]+?)(?:s)?\[(\d+)\]$/.exec(part)
    const words = (match ? match[1] : part)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
    return match ? `${words} ${Number(match[2]) + 1}` : words
  })
  const label = parts.join(' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// FluentValidation's "The length of 'X' must be 2000 characters or fewer. You entered 2554 characters."
// is written for developers; say it the way a user would.
function friendlyReason(message: string) {
  const length =
    /must be (\d+) characters or fewer\. You entered (\d+) characters/.exec(
      message
    )
  if (length)
    return `is too long (${length[2]} characters, the limit is ${length[1]})`
  return message
}

// The reason a request failed, for showing to the user: the first validation error the server listed
// (with the field it belongs to), else the problem detail or title, else the fallback.
export function getApiErrorMessage(err: unknown, fallback: string) {
  if (!axios.isAxiosError(err))
    return err instanceof Error ? err.message : fallback

  const data = err.response?.data as ProblemDetails | undefined
  const entry =
    data?.errors &&
    Object.entries(data.errors).find(([, messages]) => messages?.length)
  if (entry) {
    const [key, messages] = entry
    const message = (Array.isArray(messages) ? messages[0] : messages) as string
    const reason = friendlyReason(message)
    return reason === message
      ? `${fieldLabel(key)}: ${message}`
      : `${fieldLabel(key)} ${reason}`
  }

  return data?.detail || data?.title || fallback
}
