# Amazon SES Setup for tapinti.com

Goal: send transactional email from `noreply@tapinti.com` via Amazon SES, with DNS managed in Route 53.

## 1. Verify the domain in SES

1. AWS Console → **SES** → pick a region (e.g. `us-east-1` or `eu-central-1`) and use it consistently.
2. **Configuration → Verified identities → Create identity**.
3. Choose **Domain**, enter `tapinti.com`.
4. Enable **"Use a custom MAIL FROM domain"** if offered (e.g. `mail.tapinti.com`) — improves deliverability (SPF alignment).
5. Since DNS is in Route 53, check **"Publish DNS records to Route 53"** — SES auto-creates the DKIM CNAMEs (and MAIL FROM MX/TXT if enabled). Click **Create identity**.

## 2. Wait for verification

- SES polls Route 53's records automatically; status flips to **Verified** usually within minutes, up to 72h worst case.
- Check **Verified identities → tapinti.com** — status should show "Verified" with DKIM "Successful".

## 3. Add SPF (if not auto-added)

- If the MAIL FROM step didn't add it, add a TXT record on `tapinti.com`:

  ```
  v=spf1 include:amazonses.com ~all
  ```

- If you already have an SPF record for other mail, merge the `include:amazonses.com` into it — only one SPF TXT record is allowed per domain.

## 4. Add DMARC (recommended)

- TXT record on `_dmarc.tapinti.com`:

  ```
  v=DMARC1; p=none; rua=mailto:you@tapinti.com
  ```

- Start with `p=none` (monitor only), tighten to `quarantine`/`reject` later once mail flows are confirmed clean.

## 5. Request production access (get out of the sandbox)

- New SES accounts are in the **sandbox**: sending is limited to verified email addresses, with a low volume cap.
- SES Console → **Account dashboard** → **Request production access**.
- Fill the form: use case (transactional — signup confirmation, password reset), expected volume, how bounces/complaints are handled. Approval usually takes a few hours to a day.

## 6. Create SMTP credentials

1. SES Console → **SMTP settings** → **Create SMTP credentials**.
2. This creates an IAM user with an SES-sending policy and gives you an **SMTP username/password** (different from a regular AWS access key — generated once, save it immediately, not retrievable later).
3. Note the **SMTP endpoint** shown for the region, e.g. `email-smtp.us-east-1.amazonaws.com`, port `587` (STARTTLS).

## 7. Send as noreply@tapinti.com

- Since the whole domain is verified (not just one address), mail can be sent from any `@tapinti.com` address, including `noreply@tapinti.com`, without separately verifying that mailbox.
- Set the **From** header to `noreply@tapinti.com` in whatever sends the mail (SMTP client, app, etc.).

Result: domain verified, DKIM/SPF/DMARC in place, out of sandbox, SMTP credentials ready to send as `noreply@tapinti.com`.
