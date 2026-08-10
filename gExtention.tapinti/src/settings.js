export const DEFAULT_API_BASE = "https://api.tapinti.com";

export let settings = {
  apiBaseUrl: DEFAULT_API_BASE,
  accessToken: null,
  refreshToken: null,
  aiProvider: "anthropic",
  anthropicKey: null,
  openaiKey: null,
  googleClientId: "876332557394-rhd0tf0d8v0v5pv9o33f2qbtvi07r5o1.apps.googleusercontent.com",
  candidateId: null,
  restrictToJobSites: true,
};

// Local-only, gitignored file (see local-settings.example.json) used to seed
// chrome.storage.local on first run so you don't have to re-paste keys after
// every reinstall. It only fills in fields chrome.storage.local doesn't
// already have — it never overrides anything you've saved via Settings, and
// it's never shipped: nothing outside your machine ever reads this file.
async function loadLocalDefaults() {
  try {
    const res = await fetch(chrome.runtime.getURL("src/local-settings.json"));
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function loadSettings() {
  const [stored, localDefaults] = await Promise.all([
    chrome.storage.local.get(Object.keys(settings)),
    loadLocalDefaults(),
  ]);
  settings = { ...settings, ...localDefaults, ...stored };
  if (!settings.apiBaseUrl) settings.apiBaseUrl = DEFAULT_API_BASE;
}

export async function saveSettings(patch) {
  settings = { ...settings, ...patch };
  await chrome.storage.local.set(patch);
}
