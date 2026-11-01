# Security Review (OWASP Top 10)

Scope: jobhunter monorepo (backend.jobhunter, ui.jobhunter, website.tapinti, gExtention.tapinti, CMS, CI).
Method: static code review plus `dotnet list package --vulnerable` and `pnpm audit --prod`. No live exploitation.

Summary: 1 High, 5 Medium, several Low.

## Findings

### A01 Broken Access Control
- **Medium: cross-tenant foreign keys on create.** `backend.jobhunter/src/Application/JobApplications/Commands/CreateJobApplication/CreateJobApplication.cs:30-49` stores client-supplied `CandidateId`, `JobRoleId`, `CompanyId`, `MainContactId`, `CvId` without ownership checks. The global `OwnerId` query filter only hides rows on read, so a user can attach another user's CV/contact/company by guessing ids.
- **Low: leftover WeatherForecasts endpoint.** `GetWeatherForecastsQuery.cs` has no `[Authorize]` (group still has `RequireAuthorization()`).
- Not a finding: by-id IDOR is covered by the global `OwnerId` query filter (`Infrastructure/Data/ApplicationDbContext.cs:80`); admin operations have role checks; CV storage keys are traversal-safe.

### A02 Cryptographic Failures / Secrets
- **Medium: hardcoded DB password.** `Web/appsettings.json:3` (`Password=Aman@123`), tracked in git.
- **Low: bearer token in JS-readable cookie** with no `Secure`/`SameSite` (`ui.jobhunter/src/lib/cookies.ts`, `stores/auth-store.ts:56`).
- **Low: 7-day bearer token, no revocation** (`Infrastructure/DependencyInjection.cs:49`).
- No secrets found in git history.

### A03 Injection
- No raw SQL; EF is parameterized.
- **Medium: prompt injection** via job page text (`ExtractJobCommand`) and uploaded CV text. Output only returns to the same user.

### A04 Insecure Design
- **Medium: no rate/cost limits on AI endpoints** (JobExtraction, CvGeneration, CvImport).
- **Low: unvalidated CV upload.** No extension/size/content-type check; client `ContentType` is stored and echoed (`UploadCv.cs`, `Web/Endpoints/Cvs.cs:17`). Download is an attachment, but there is no `nosniff`.

### A05 Security Misconfiguration
- **Medium: Scalar/OpenAPI exposed in production** (`Web/Program.cs:37-38`; `/` redirects to `/scalar`).
- **Low: CORS allows any origin/method/header** (`Program.cs:25-28`); bearer tokens, so not CSRF-exploitable.
- **Low: Postgres published on host port** with default `admin`/`password` fallbacks (`docker-compose.yml:9`).
- **Low: UI nginx has no CSP, X-Frame-Options, nosniff or HSTS** (`ui.jobhunter/nginx.conf`).
- **Low: backend serves HTTP only**; relies on a TLS-terminating proxy.
- **Low: `ui.jobhunter/.debug-scratch/` is tracked.**
- Info: exception handler is registered after file server/endpoints; verify errors don't leak.

### A06 Vulnerable Components
- NuGet: none vulnerable.
- `pnpm audit --prod`: ui.jobhunter 61 (2 critical, 28 high); website.tapinti 31 (5 critical, 14 high, incl. `next` < 16.3.8); CMS 162 (6 critical, 61 high). Mostly transitive; reachability not confirmed.

### A07 Identification and Authentication Failures
- **High: Google login accepts any Google access token.** `Infrastructure/Identity/IdentityService.cs` (~250-262): if the `tokeninfo` audience check fails, it falls back to `oauth2/v3/userinfo` with no audience/client check. A malicious app a victim signs into can replay the victim's token here and get a session as the victim.
- **Medium: pre-hijack by email.** Google login links to an existing local account by email (`FindByEmailAsync`, ~288). An attacker who pre-registered the victim's email keeps password access after the victim signs in with Google.
- **Medium: no rate limiting** on login/register/forgotPassword/google-login (spam and SES cost; Identity default lockout only).
- **Medium: seeded admin** `administrator@localhost.com` / `Administrator1!` is created unconditionally (`ApplicationDbContextInitialiser.cs`).
- **Low: default Identity password policy** (6 characters).

### A08 Software and Data Integrity Failures
- **Low: GitHub Actions pinned to tags, not SHAs** (`appleboy/ssh-action`, `appleboy/scp-action`), and they run with the VPS SSH key.
- **Low: `reset-jobhunter-db.yml`** is `workflow_dispatch` only, guarded by typed `RESET`; any repo writer can wipe production.
- Extension manifest and CSP are tight; tokens in `chrome.storage.local`; no page-triggerable message path found.

### A09 Logging and Monitoring Failures
- **Medium: sensitive request bodies logged.** `Application/Common/Behaviours/LoggingBehaviour.cs:~30` logs `{@Request}` for every command (passwords, Google ID tokens, CV text).
- No audit trail for admin actions or failed logins beyond Identity defaults. Langfuse `LogContent` defaults to false.

### A10 SSRF
- No server-side fetching of user-supplied URLs. Outbound calls go to fixed Google and AI provider endpoints.

## Not covered
- No live exploitation; `CvRendering` not read in depth; UI/website source only grep-checked; Strapi permissions and `CMS/.tmp/data.db` not checked.

---

# Fix Plan

## Phase 1: Immediate (High / credential risk)
1. **Google login (A07 High).** In `IdentityService.GoogleLoginAsync`, remove the `userinfo` fallback. Accept only ID tokens whose `aud == ClientId` and `email_verified == true`; also check `iss` and `exp`. Preferably validate locally with `Google.Apis.Auth` `GoogleJsonWebSignature.ValidateAsync` and `Audience = [ClientId]`. Check that the UI sends an ID token, not an access token. Add a test that a token with the wrong audience is rejected.
2. **Seeded admin (A07).** Seed the admin only in Development, or read its email and password from config/secret, and fail startup if it is missing in Production. Verify production has no `administrator@localhost.com` account, or rotate its password.
3. **DB password (A02).** Replace the value in `appsettings.json` with an empty placeholder, rotate the password on every environment where it was used, and keep real values in env vars or Key Vault. Make the `docker-compose.yml` fallbacks required (`${POSTGRES_PASSWORD:?}`).
4. **Log redaction (A09).** In `LoggingBehaviour`, log only the request name and user id. If request logging is wanted, add a `[SensitiveData]` or allowlist mechanism and exclude `SetPasswordCommand`, `GoogleLoginCommand`, CV and profile import commands.

## Phase 2: Short term (Medium)
5. **Cross-tenant FKs (A01).** Add validators or handler checks that every referenced id exists under the owner's query filter (`AnyAsync` on candidate, role, company, contact, CV). Apply to Create/Update for applications, interviews, activities, notes and contacts. Add functional tests with two users.
6. **Rate limiting (A04/A07).** Add `AddRateLimiter` with a per-IP policy on `/api/Users/login|register|forgotPassword|resendConfirmationEmail|google-login`, and a per-user policy on AI endpoints. Add a daily per-user AI quota.
7. **Pre-hijack (A07).** In the Google link path, refuse to auto-link when the existing account has `EmailConfirmed == false`. Instead confirm the email, clear any existing password hash and reset the security stamp. Set `RequireConfirmedEmail = true` in Identity options.
8. **Scalar/OpenAPI (A05).** Map them only in Development, or behind `RequireAuthorization` with the Administrator role. Change the `/` redirect.
9. **Prompt injection (A03).** Put untrusted text in clearly delimited blocks, instruct the model to treat it as data, validate output against a strict schema, and cap input length. Never give the model tool access.

## Phase 3: Hardening (Low)
10. **Uploads (A04).** Allowlist `.pdf` and `.docx`, check magic bytes, set `[RequestSizeLimit]` (e.g. 5 MB), force the stored `ContentType` from the allowlist, and add `X-Content-Type-Options: nosniff`.
11. **Tokens (A02).** Shorten the access token (e.g. 1 hour) and implement the refresh flow. Set `Secure; SameSite=Strict` on the UI cookie. Consider an `HttpOnly` cookie issued by the backend.
12. **CORS (A05).** Restrict to the UI origin, the website origin and the extension origin (`chrome-extension://<id>`), from config.
13. **Headers (A05).** Add nginx headers (CSP, `X-Frame-Options: DENY`, nosniff, Referrer-Policy, HSTS at the TLS edge). Add the same to the backend via middleware.
14. **Infrastructure (A05).** Bind Postgres to `127.0.0.1` or drop `ports`, and confirm the firewall. Confirm the proxy terminates TLS for the backend.
15. **Password policy (A07).** Set `Password.RequiredLength = 10` and enable lockout settings explicitly.
16. **Cleanup (A01/A05).** Delete the `WeatherForecasts` feature and the tracked `.debug-scratch/`. Move `UseExceptionHandler` to the start of the pipeline.
17. **CI (A08).** Pin actions to commit SHAs, add Dependabot for Actions, and protect the reset workflow with a GitHub Environment that requires reviewers.
18. **Logging (A09).** Add structured audit logs for login success and failure, role changes, password changes and admin queries.

## Phase 4: Dependencies (A06)
19. Upgrade `next` to >= 16.3.8 and `vite` to >= 8.1.6, then re-run `pnpm audit --prod` in all three JS projects. Upgrade Strapi to the latest patch. Triage the remaining transitive findings by reachability. Add `dotnet list package --vulnerable` and `pnpm audit` to CI.

## Verification
- Add tests: wrong-audience Google token rejected; two-user FK ownership; rate-limit 429s; upload rejection; no admin seed in Production.
- Re-run this review after Phases 1 and 2, and add a live check of the Google flow, rate limits and headers (`curl -I`).
