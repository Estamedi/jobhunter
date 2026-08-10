# Tapinti Job Saver — Chrome Extension

Read the job posting on the current page, extract the details with AI, and save it to the Tapinti job-hunt CRM with one click.

## How it works

1. You open a job posting (LinkedIn, Indeed, a company careers page, …) and click the extension.
2. The extension reads the page (visible text + any JSON-LD `JobPosting` structured data), refusing to read pages that don't look like a job posting (see **Only read known job sites** below).
3. The page content is sent to the backend's `POST /api/JobExtraction`, which calls whichever AI provider it has configured (Claude or OpenAI, both using structured outputs — see `backend.jobhunter/src/Infrastructure/AiExtraction`) and returns clean JSON: title, company, location, work type, salary, description, requirements. The extension never holds an AI API key — those live only in the backend's configuration. If that call fails (network issue, no provider configured, etc.), a basic JSON-LD/heuristic parser is used instead.
4. You review/edit the pre-filled form and hit **Save to portal**, which calls the backend:
   - `GET/POST /api/Companies` — reuse the company if it already exists (matched by name), else create it
   - `POST /api/job-roles` — create the role
   - `POST /api/applications` — create the application for the selected candidate (status defaults to `Wishlist`; `appliedDate` is set automatically when status is `Applied`)

Auth uses the portal's Identity bearer tokens (`POST /api/Users/login`), with automatic refresh via `/api/Users/refresh`. You can also sign in with **Google** — see below.

## Install (unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this folder (`gExtention.tapinti`)

## Setup

1. Click the extension icon → sign in with your portal account (email/password, or Google — see below).
2. Click the ⚙ icon:
   - **Portal API base URL** — defaults to `https://api.tapinti.com`; use `http://localhost:5290` (docker) or `http://localhost:5124` (dotnet run) for local dev.
   - **Only read known job sites** — on by default; restricts page reading to known job boards/ATS platforms (or pages with `JobPosting` structured data). Turn off to allow any page.
   - **Google client ID** — needed for "Continue with Google" (see below).

   AI provider API keys are configured server-side (`backend.jobhunter/src/Web/appsettings.json` → `AiExtraction`, or user-secrets) — never in the extension.

### Setting up "Continue with Google"

Google Identity Services' popup-based token flow doesn't work reliably inside an MV3 extension popup (the popup loses focus — and closes — as soon as the Google auth window opens). The extension instead uses `chrome.identity.launchWebAuthFlow`, which Chrome drives itself, so it survives that.

1. Open the ⚙ settings view once so it can show you this extension's redirect URI (next to the "Google client ID" field) — it looks like `https://<extension-id>.chromiumapp.org/`.
2. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), open the OAuth 2.0 **Web application** client the portal already uses (the same one behind `VITE_GOOGLE_CLIENT_ID` in `ui.jobhunter/.env`), and add that redirect URI to its **Authorized redirect URIs**. You can reuse the same client — no new one needed.
3. Paste that client ID into the extension's **Google client ID** setting and save.
4. Sign out (if signed in) and click **Continue with Google** on the login screen.

The extension requests an OAuth access token with scope `openid email profile` and posts it to the portal's `POST /api/Users/google-login` (same endpoint the web app uses), which returns the same bearer/refresh token pair as a normal login.

Note: an unpacked extension's ID (and therefore its redirect URI) changes if you re-load it from a different path or without a pinned `key` in `manifest.json`. If sign-in starts failing after reloading the extension, re-check the redirect URI in Settings and update it in Google Cloud Console.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | MV3 manifest — popup action, `activeTab`/`scripting`/`storage`/`identity` permissions |
| `popup.html/css` | Popup UI: login (incl. Google sign-in), settings, and the editable job form |
| `src/popup.js` | Entry point — wires DOM events, orchestrates the extract/save flows. Loaded as an ES module (`<script type="module">`), no build step |
| `src/settings.js` | `chrome.storage.local`-backed settings (API base URL, tokens, restrict-to-job-sites flag) |
| `src/api/client.js` | Portal `api()` fetch wrapper — auth header, 401 handling, refresh-token retry |
| `src/api/auth.js` | Email/password login, Google sign-in (`chrome.identity.launchWebAuthFlow`) |
| `src/api/users.js` | `GET /api/Users/me` (cached per popup session) + JobSeeker role check |
| `src/api/jobs.js` | Company/JobRole/Application creation, candidate-picker loading |
| `src/api/extraction.js` | Calls the backend's `POST /api/JobExtraction` with the page content |
| `src/extraction/page-reader.js` | Injected content script that reads the active tab's job posting; gates on known job-site hosts / `JobPosting` markup |
| `src/extraction/job-hosts.js` | Allowlist of known job board/ATS hostnames |
| `src/extraction/extract-job.js` | Calls the backend for AI extraction, falling back to the basic parser on failure |
| `src/extraction/basic-extract.js` | JSON-LD/heuristic fallback parser (no network call, no AI) |
| `src/ui/dom.js`, `src/ui/views.js`, `src/ui/form.js` | `$()` helper, view switching, form fill/read |

## Notes

- The page is read only when you click the extension (`activeTab`), nothing runs in the background.
- The extension holds no AI API keys; page content for extraction goes only to your own configured backend, which calls the AI provider server-side.
- Cost per save is a fraction of a cent (one small AI request).
