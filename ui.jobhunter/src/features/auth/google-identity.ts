interface GoogleTokenResponse {
  access_token?: string
}

interface GoogleAccountsOauth2 {
  initTokenClient: (options: {
    client_id: string
    scope: string
    callback: (response: GoogleTokenResponse) => void
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

function loadGoogleIdentityScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve()
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    )

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject()
    document.head.appendChild(script)
  })
}

/** Loads Google Identity Services and resolves an OAuth access token for the signed-in Google account. */
export async function getGoogleIdToken() {
  const configuredToken = import.meta.env.VITE_GOOGLE_ID_TOKEN as
    | string
    | undefined

  if (configuredToken) {
    return configuredToken
  }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  if (!clientId) {
    throw new Error('Google client id is not configured.')
  }

  await loadGoogleIdentityScript()

  return new Promise<string>((resolve, reject) => {
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.access_token) {
          resolve(response.access_token)
        } else {
          reject(new Error('Google did not return a token.'))
        }
      },
    })

    if (!tokenClient) {
      reject(new Error('Google sign-in is not available.'))
      return
    }

    tokenClient.requestAccessToken()
  })
}
