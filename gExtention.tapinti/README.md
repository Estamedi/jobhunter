# Tapinti Job Saver — Chrome Extension

Read the job posting on the current page, extract the details with AI (Claude), and save it to the Tapinti job-hunt CRM with one click.

## How it works

1. You open a job posting (LinkedIn, Indeed, a company careers page, …) and click the extension.
2. The extension reads the page (visible text + any JSON-LD `JobPosting` structured data).
3. The page content is sent to the **Claude API** (`claude-opus-4-8`, structured outputs) which returns clean JSON: title, company, location, work type, salary, description, requirements. If no Anthropic key is configured, a basic JSON-LD/heuristic parser is used instead.
4. You review/edit the pre-filled form and hit **Save to portal**, which calls the backend:
   - `GET/POST /api/Companies` — reuse the company if it already exists (matched by name), else create it
   - `POST /api/job-roles` — create the role
   - `POST /api/applications` — create the application for the selected candidate (status defaults to `Wishlist`; `appliedDate` is set automatically when status is `Applied`)

Auth uses the portal's Identity bearer tokens (`POST /api/Users/login`), with automatic refresh via `/api/Users/refresh`.

## Install (unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this folder (`gExtention.tapinti`)

## Setup

1. Click the extension icon → sign in with your portal account.
2. Click the ⚙ icon:
   - **Portal API base URL** — defaults to `https://api.tapinti.com`; use `http://localhost:5290` (docker) or `http://localhost:5124` (dotnet run) for local dev.
   - **Anthropic API key** — get one at <https://platform.claude.com>; needed for AI extraction. Stored only in `chrome.storage.local` on your machine.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | MV3 manifest — popup action, `activeTab`/`scripting`/`storage` permissions |
| `popup.html/css` | Popup UI: login, settings, and the editable job form |
| `popup.js` | Page extraction (injected script), Claude API call, portal API client, save flow |

## Notes

- The page is read only when you click the extension (`activeTab`), nothing runs in the background.
- Your Anthropic key is sent only to `api.anthropic.com`; page content is sent to the Claude API for extraction.
- Cost per save is a fraction of a cent (one small Claude request).
