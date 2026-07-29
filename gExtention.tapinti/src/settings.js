export const DEFAULT_API_BASE = "https://api.tapinti.com";

export let settings = {
  apiBaseUrl: DEFAULT_API_BASE,
  accessToken: null,
  refreshToken: null,
  anthropicKey: null,
  googleClientId: "876332557394-rhd0tf0d8v0v5pv9o33f2qbtvi07r5o1.apps.googleusercontent.com",
  candidateId: null,
};

export async function loadSettings() {
  const stored = await chrome.storage.local.get(Object.keys(settings));
  settings = { ...settings, ...stored };
  if (!settings.apiBaseUrl) settings.apiBaseUrl = DEFAULT_API_BASE;
}

export async function saveSettings(patch) {
  settings = { ...settings, ...patch };
  await chrome.storage.local.set(patch);
}
