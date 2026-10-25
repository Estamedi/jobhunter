import { loadSettings } from "./settings.js";
import { loginWithGoogle } from "./api/auth.js";

// The Google sign-in window steals focus, which closes the extension popup and
// kills its JS context. The flow therefore runs here, in the service worker,
// and stores the tokens in chrome.storage.local — the popup picks them up the
// next time it opens (or gets the reply right away if it's still open).
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "google-login") return false;
  (async () => {
    try {
      await loadSettings();
      await loginWithGoogle();
      sendResponse({ ok: true });
    } catch (err) {
      sendResponse({ ok: false, error: err.message });
    }
  })();
  return true;
});
