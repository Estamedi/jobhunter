# Tapinti Job Saver — Chrome Web Store Release Checklist

Based on release review against `tapinti_chrome_extension_release_review_brief.md`.

## Blockers

- [ ] Delete/exclude `src/local-settings.json` from the packaged zip — it contains a live OpenAI key (`sk-proj-...`). Not tracked by git, but nothing currently stops it from being zipped for upload.
- [ ] Rotate that OpenAI key since it has sat in a plaintext file.
- [x] Add extension icons (16/32/48/128 px) and an `icons` key in `manifest.json` — generated from the Tapinti design system's fan-card mark (`icons/icon*.png`), wired into `manifest.json` `icons` and `action.default_icon`.
- [ ] Remove dev-only `host_permissions` from production manifest: `http://localhost/*`, `http://127.0.0.1/*`.
- [ ] Write and host a privacy policy matching the actual data flows (see mapping below).
- [ ] Remove debug logging: `src/popup.js:37` — `console.log("Extracted job:", job)`.

## High priority

- [ ] Narrow page-text capture in `src/extraction/page-reader.js` — currently sends `document.body.innerText` (up to 50,000 chars), which includes nav/sidebar/unrelated page content, not just the job posting. Scope to the job content container or JSON-LD only.
- [ ] Verify Google sign-in flow: `src/api/auth.js` uses the OAuth implicit flow (`response_type=token`) and posts the resulting opaque access token to the backend as `idToken` — confirm backend validation expectations match what's actually sent.
- [ ] Update button/UI copy: "Save to portal" → "Save job to Tapinti"; add a short note near the extraction step disclosing that AI processing happens on the Tapinti backend.
- [ ] Bump `version` in `manifest.json` past `1.3.0` once changes ship.

## Nice to have

- [ ] Strip `<nav>/<header>/<footer>/<script>` content before capturing page text, for a smaller/cleaner payload.
- [ ] Consider an explicit `content_security_policy` in the manifest (MV3 default is already safe; optional for auditor clarity).

## Production manifest

```json
{
  "manifest_version": 3,
  "name": "Tapinti Job Saver",
  "version": "1.4.0",
  "description": "Read the job posting you're viewing, extract it with AI, and save it to your Tapinti job-hunt CRM.",
  "action": {
    "default_popup": "popup.html",
    "default_title": "Save this job to Tapinti"
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "permissions": ["activeTab", "scripting", "storage", "identity"],
  "host_permissions": ["https://api.tapinti.com/*"]
}
```

## Privacy Practices (Chrome Web Store), derived from code

| Category | Collected? | Basis |
|---|---|---|
| Website content | Yes | Page text/title/JSON-LD sent to `POST /api/JobExtraction` |
| Web history / browsing activity | No | Only the single active tab at click time; no `tabs`/`history` API, no background listeners |
| Authentication information | Yes | Email/password + Google OAuth token, sent to Tapinti's own backend, stored in `chrome.storage.local` |
| Personal communications | No | — |
| Personally identifiable information | Yes | User login identity, job records tied to account |
| Location | No | City/country are extracted/typed job-posting fields, not device geolocation |
| User activity / analytics | No | No tracking/analytics code found |

## Store submission checklist

- [ ] `src/local-settings.json` excluded from package; OpenAI key rotated
- [ ] Icon assets added (16/32/48/128) + manifest `icons` key
- [ ] `host_permissions` stripped to `https://api.tapinti.com/*` only
- [ ] `console.log` of extracted job data removed
- [ ] Privacy policy written and hosted
- [ ] Page-text capture narrowed away from full `body.innerText`
- [ ] Google `idToken`/`access_token` handling confirmed with backend
- [ ] Button copy + AI-processing disclosure updated
- [ ] Version bumped
- [ ] Store listing text, screenshots, support contact finalized
- [ ] No "Official/Approved/Partner LinkedIn" language anywhere
- [ ] Non-Trader selected in Developer Dashboard (account setting, not code)
