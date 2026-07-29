import { settings, saveSettings } from "../settings.js";

export async function login(email, password) {
  const res = await fetch(
    `${settings.apiBaseUrl}/api/Users/login?useCookies=false&useSessionCookies=false`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
  );
  if (!res.ok) throw new Error("Login failed — check email and password.");
  const data = await res.json();
  await saveSettings({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
}

// MV3 extensions can't rely on Google Identity Services' popup-based token
// client — the extension popup loses focus (and closes) as soon as the
// auth popup opens. chrome.identity.launchWebAuthFlow is the flow Chrome
// actually supports for this: it drives the OAuth redirect in a window
// Chrome controls itself, so it survives the extension popup closing.
function getGoogleAccessToken() {
  if (!settings.googleClientId) {
    return Promise.reject(
      new Error('Set a Google client ID in Settings first, then try "Continue with Google" again.'),
    );
  }

  const redirectUri = chrome.identity.getRedirectURL();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", settings.googleClientId);
  authUrl.searchParams.set("response_type", "token");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("prompt", "select_account");

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive: true },
      (redirectedTo) => {
        if (chrome.runtime.lastError || !redirectedTo) {
          reject(new Error(chrome.runtime.lastError?.message || "Google sign-in was cancelled."));
          return;
        }
        const params = new URLSearchParams(new URL(redirectedTo).hash.slice(1));
        const accessToken = params.get("access_token");
        if (params.get("error")) {
          reject(new Error(`Google sign-in failed: ${params.get("error")}`));
        } else if (!accessToken) {
          reject(new Error("Google did not return an access token."));
        } else {
          resolve(accessToken);
        }
      },
    );
  });
}

export async function loginWithGoogle() {
  const accessToken = await getGoogleAccessToken();
  const res = await fetch(`${settings.apiBaseUrl}/api/Users/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: accessToken }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google sign-in failed (${res.status}).\n${body.slice(0, 300)}`);
  }
  const data = await res.json();
  await saveSettings({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
}
