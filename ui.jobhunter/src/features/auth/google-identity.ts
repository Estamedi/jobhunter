import i18n from '@/i18n'

const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

interface GoogleTokenResponse {
  access_token?: string
}

interface GoogleTokenClientError {
  type?: 'popup_failed_to_open' | 'popup_closed' | 'unknown'
}

interface GoogleAccountsOauth2 {
  initTokenClient: (options: {
    client_id: string
    scope: string
    callback: (response: GoogleTokenResponse) => void
    error_callback?: (error: GoogleTokenClientError) => void
  }) => {
    requestAccessToken: () => void
  }
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleAccountsOauth2
      }
    }
  }
}

let scriptPromise: Promise<void> | null = null

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve()
  }

  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = GOOGLE_IDENTITY_SCRIPT_SRC
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        // Drop the failed script so the next attempt downloads it again.
        script.remove()
        scriptPromise = null
        reject(new Error(i18n.t('Google sign-in is not available.')))
      }
      document.head.appendChild(script)
    })
  }

  return scriptPromise
}

/**
 * Starts downloading Google Identity Services ahead of the click. Safari (notably on iOS) only opens
 * a popup while it is still handling the tap, so the script must be ready before the user presses the
 * Google button; waiting for it inside the click handler gets the popup blocked.
 */
export function preloadGoogleIdentity() {
  if (
    import.meta.env.VITE_GOOGLE_ID_TOKEN ||
    !import.meta.env.VITE_GOOGLE_CLIENT_ID
  ) {
    return
  }

  loadGoogleIdentityScript().catch(() => {
    // Retried when the user presses the button.
  })
}

function requestGoogleAccessToken(
  oauth2: GoogleAccountsOauth2,
  clientId: string
) {
  return new Promise<string>((resolve, reject) => {
    const tokenClient = oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.access_token) {
          resolve(response.access_token)
        } else {
          reject(new Error(i18n.t('Google did not return a token.')))
        }
      },
      // Without this a blocked or closed popup never settles and the button spins forever.
      error_callback: (error) => {
        reject(
          new Error(
            error.type === 'popup_failed_to_open'
              ? i18n.t(
                  'Google sign-in popup was blocked. Please tap the button again.'
                )
              : error.type === 'popup_closed'
                ? i18n.t('Google sign-in was cancelled.')
                : i18n.t('Failed to sign in with Google. Please try again.')
          )
        )
      },
    })

    tokenClient.requestAccessToken()
  })
}

/** Resolves an OAuth access token for the signed-in Google account. Call it directly from a click handler. */
export async function getGoogleIdToken() {
  const configuredToken = import.meta.env.VITE_GOOGLE_ID_TOKEN as
    | string
    | undefined

  if (configuredToken) {
    return configuredToken
  }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  if (!clientId) {
    throw new Error(i18n.t('Google client id is not configured.'))
  }

  // Open the popup synchronously, before any await, so the browser still treats it as part of the tap.
  const oauth2 = window.google?.accounts?.oauth2
  if (oauth2) {
    return requestGoogleAccessToken(oauth2, clientId)
  }

  // The script was not preloaded (slow network). The popup may now be blocked, which error_callback reports.
  await loadGoogleIdentityScript()

  const loaded = window.google?.accounts?.oauth2
  if (!loaded) {
    throw new Error(i18n.t('Google sign-in is not available.'))
  }

  return requestGoogleAccessToken(loaded, clientId)
}
