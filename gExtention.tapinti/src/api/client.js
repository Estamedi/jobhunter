import { settings, saveSettings } from "../settings.js";
import { show } from "../ui/views.js";

export async function api(path, options = {}, allowRetry = true) {
  const res = await fetch(settings.apiBaseUrl + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(settings.accessToken
        ? { Authorization: `Bearer ${settings.accessToken}` }
        : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && allowRetry && settings.refreshToken) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return api(path, options, false);
  }
  if (res.status === 401) {
    show("login");
    throw new Error("Session expired — please sign in again.");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const problem = (() => { try { return JSON.parse(body); } catch { return null; } })();
    const err = new Error(
      problem?.detail || `Portal API ${res.status} on ${path}\n${body.slice(0, 300)}`,
    );
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

async function tryRefreshToken() {
  try {
    const res = await fetch(`${settings.apiBaseUrl}/api/Users/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: settings.refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    await saveSettings({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    return true;
  } catch {
    return false;
  }
}
