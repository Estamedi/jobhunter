# Security Review (OWASP Top 10)

Scope: jobhunter monorepo (backend.jobhunter, ui.jobhunter, website.tapinti, gExtention.tapinti, CMS, CI).
Method: static code review plus `dotnet list package --vulnerable` and `pnpm audit --prod`. No live exploitation.

Legend: ✅ Done · ⏳ Not done · ➖ Skipped by decision · ℹ️ No change needed

## Status at a glance

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | Google login accepts any Google access token (A07) | High | ✅ |
| 2 | Cross-tenant foreign keys on create/update (A01) | Medium | ✅ |
| 3 | Hardcoded DB password in `appsettings.json` (A02) | Medium | ✅ (rotate the password yourself) |
| 4 | Prompt injection in AI prompts (A03) | Medium | ✅ |
| 5 | No rate/cost limits on auth and AI endpoints (A04/A07) | Medium | ✅ |
| 6 | Scalar/OpenAPI exposed in production (A05) | Medium | ✅ |
| 7 | Pre-hijack by email on Google link (A07) | Medium | ✅ |
| 8 | Seeded `administrator@localhost.com` / `Administrator1!` (A07) | Medium | ✅ (check production for the old account) |
| 9 | Request bodies logged (A09) | Medium | ✅ |
| 10 | Unvalidated CV upload (A04) | Low | ✅ |
| 11 | Default password policy and lockout (A07) | Low | ✅ |
| 12 | CORS allows any origin (A05) | Low | ✅ allowlist supported; set `CORS_ALLOWED_ORIGIN` to enforce it |
| 13 | Missing security headers: API and UI nginx (A05) | Low | ✅ (CSP and HSTS not added) |
| 14 | Postgres published on host port, default password fallback (A05) | Low | ✅ dev compose bound to 127.0.0.1 and password required |
| 15 | WeatherForecasts leftover endpoint (A01) | Low | ✅ deleted |
| 16 | `.debug-scratch/` tracked (A05) | Low | ✅ removed and gitignored |
| 17 | Exception handler registered late (A05) | Info | ✅ moved to start of pipeline |
| 18 | Reset-DB workflow has no approval gate (A08) | Low | ✅ partly: `environment: production-reset` added; you must create the environment with required reviewers in GitHub |
| 19 | Bearer token in JS-readable cookie, no `Secure`/`SameSite` (A02) | Low | ⏳ |
| 20 | 7-day bearer token, no revocation or refresh flow (A02) | Low | ⏳ |
| 21 | CSP and HSTS (A05) | Low | ⏳ |
| 22 | GitHub Actions pinned to tags, not SHAs (A08) | Low | ⏳ |
| 23 | No audit logging of logins and admin actions (A09) | Low | ⏳ |
| 24 | Vulnerable JS dependencies (A06) | Mixed | ➖ skipped by decision |
| 25 | SSRF (A10), SQL injection (A03), by-id IDOR (A01) | n/a | ℹ️ no issue found |

## What changed in the code

- **Google login:** `IdentityService.cs` no longer trusts the `userinfo` fallback alone. It checks Google `tokeninfo` first, and the token's `aud` or `azp` must equal your client id. The `sub` values must match.
- **Email pre-hijack:** linking Google to an unconfirmed local account removes its password, confirms it and resets the security stamp. Password login now requires a confirmed email (`RequireConfirmedEmail`). The seeded admin is created already confirmed.
- **Foreign keys:** `Common/Interfaces/OwnedReferenceExtensions.cs` checks that every referenced id belongs to the caller. It is used in the application, interview, activity, role and contact handlers.
- **Rate limiting:** `Web/Infrastructure/RateLimiting.cs`. Auth endpoints get 10 per minute per IP. AI endpoints get 10 per minute and 100 per day per user. Forwarded headers are enabled so the client IP is real. Tunable with `RateLimiting:*`.
- **Admin seed:** `Seed:AdminEmail` and `Seed:AdminPassword`. The built-in default exists only in Development. Pipeline secrets `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are wired into the workflow, deploy script and prod compose.
- **DB password:** removed from `appsettings.json`. `docker-compose.yml` requires `POSTGRES_PASSWORD`.
- **Logging:** `LoggingBehaviour` logs only the request name and user.
- **Scalar/OpenAPI:** mapped only in Development, and the `/` redirect too.
- **Prompt injection:** `Infrastructure/AiCommon/UntrustedText.cs` wraps page and CV text in tagged blocks with a "treat as data" notice and length caps. `ExtractJobCommandValidator` caps input sizes.
- **CV upload:** only `.pdf`, `.doc` and `.docx`, up to 10 MB, signature check, server-set content type, 12 MB request limit. DOCX XML is size-capped before reading.
- **Identity options:** minimum password length 10, lockout after 5 attempts for 15 minutes. The sign-up, reset and change-password forms now require 10.
- **CORS and headers:** CORS reads `Cors:AllowedOrigins`. The API sends `nosniff`, `X-Frame-Options: DENY` and `Referrer-Policy`. The UI nginx sends `nosniff`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy` in every location.

## Manual steps for you

1. Rotate the Postgres password everywhere `Aman@123` was used, and update the `POSTGRES_PASSWORD` secret if it matched.
2. Check production for an existing `administrator@localhost.com`. Delete it or change its password.
3. Rotate the OpenAI key in your local `appsettings.Development.json` if that file was ever shared.
4. Set `CORS_ALLOWED_ORIGIN` on the VPS to the UI origin to enforce the CORS allowlist.
5. Create the `production-reset` environment in GitHub with required reviewers.
6. Make sure only the reverse proxy can reach the backend port 8080. Forwarded headers trust any sender.
7. Users who registered by password but never confirmed their email can no longer log in. They must confirm, or use Google.

## Original findings (reference)

### A01 Broken Access Control
- Cross-tenant foreign keys on create (`CreateJobApplication.cs` and others). ✅
- Leftover `WeatherForecasts` endpoint. ✅
- By-id IDOR is covered by the global `OwnerId` query filter. ℹ️

### A02 Cryptographic Failures / Secrets
- Hardcoded DB password. ✅
- Bearer token in a JS-readable cookie without `Secure`/`SameSite`. ⏳
- 7-day bearer token with no revocation. ⏳
- No secrets found in git history. ℹ️

### A03 Injection
- No raw SQL. ℹ️
- Prompt injection via job page text and CV text. ✅

### A04 Insecure Design
- No rate or cost limits on AI endpoints. ✅
- Unvalidated CV upload. ✅

### A05 Security Misconfiguration
- Scalar/OpenAPI exposed in production. ✅
- CORS any origin. ✅ (set the origin to enforce)
- Postgres published on host port. ✅
- UI nginx security headers. ✅ (CSP and HSTS ⏳)
- Backend serves HTTP only, relying on a TLS proxy. ⏳ (infrastructure; nothing to change in code)
- `.debug-scratch/` tracked. ✅
- Exception handler registered late. ✅

### A06 Vulnerable Components
- NuGet: none vulnerable. ℹ️
- `pnpm audit --prod`: ui.jobhunter 61 (2 critical, 28 high); website.tapinti 31 (5 critical, 14 high, including `next` below 16.3.8); CMS 162 (6 critical, 61 high). ➖ Skipped by decision.

### A07 Identification and Authentication Failures
- Google login accepts any Google access token. ✅
- Pre-hijack by email. ✅
- No rate limiting on identity endpoints. ✅
- Seeded admin. ✅
- Default password policy. ✅

### A08 Software and Data Integrity Failures
- Actions pinned to tags, not SHAs. ⏳
- Reset-DB workflow. ✅ partly (environment added; reviewers are a manual step)
- Extension manifest and token storage are acceptable. ℹ️

### A09 Logging and Monitoring Failures
- Sensitive request bodies logged. ✅
- No audit trail for admin actions or failed logins. ⏳

### A10 SSRF
- No server-side fetching of user-supplied URLs. ℹ️

## Not covered
- No live exploitation. `CvRendering` was not read in depth. The UI and website source were only grep-checked. Strapi permissions and `CMS/.tmp/data.db` were not checked.

## Remaining work (optional)

1. **Token lifetime and refresh (A02):** shorten the access token (about 1 hour) and add a refresh flow in the UI. Doing only the first part signs everyone out after an hour.
2. **Cookie flags (A02):** set `Secure; SameSite=Strict` on the UI token cookie, or move the token to an `HttpOnly` cookie issued by the backend.
3. **CSP and HSTS (A05):** add a Content-Security-Policy to the UI after testing it against the Google sign-in script, and HSTS at the TLS edge.
4. **Pin GitHub Actions to commit SHAs (A08)** and enable Dependabot for Actions.
5. **Audit logging (A09):** log login success and failure, role changes, password changes and admin queries.
6. **Dependencies (A06):** upgrade `next`, `vite` and Strapi, re-run `pnpm audit --prod`, and add audits to CI.
7. **Tests:** add tests for the wrong-audience Google token, two-user foreign key ownership, the rate-limit 429s, upload rejection and the admin seed in Production.
