# Chrome Web Store listing (copy/paste)

**Name:** ApplyLadder Job Saver
**Category:** Productivity
**Single purpose:** Save the job posting you are viewing to your ApplyLadder job-hunt CRM.
**Privacy policy URL:** https://app.applyladder.com/privacy

## Short description (≤132 chars)
Save any job posting to your ApplyLadder job tracker in one click — AI fills in the title, company, salary and requirements.

## Detailed description
ApplyLadder Job Saver lets you capture job postings while you browse and keep them in your ApplyLadder job-hunt CRM.

Open a job posting, click the extension, review the pre-filled details (title, company, location, work type, salary, description, requirements) and press Save. Nothing is saved until you confirm.

- Works on LinkedIn, Indeed and other job pages
- AI extraction runs on the ApplyLadder backend — no API key needed
- Reads the page only when you click the extension; no background tracking
- Sign in with email or Google

Requires a free ApplyLadder account. Not affiliated with LinkedIn or Indeed.

## Permission justifications
- **activeTab** — read the job posting on the tab the user is viewing, only after they click the extension.
- **scripting** — inject a one-time function into that tab to read its text and JobPosting structured data.
- **storage** — keep the user's sign-in session and settings locally.
- **identity** — "Continue with Google" sign-in via launchWebAuthFlow.
- **Host permission https://api.applyladder.com/\*** — send the extracted job to, and sign in with, the ApplyLadder API.
- **Remote code:** No. All code is bundled in the package.

## Data usage disclosures
Collected: website content (job page text), authentication information, personally identifiable information (account email/name).
Certify: not sold; not used outside the single purpose; not used for creditworthiness/lending.

## Still to supply manually
Screenshots (1280×800), small promo tile (440×280), support email, Developer account (Non-Trader).
