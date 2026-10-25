# Onboarding Questions

Questions asked to a new user after signup. Based on the reference screenshots in this folder. The flow has 4 steps (segmented progress bar), followed by a plan/paywall page.

⭐ = key question: directly affects job matching, auto-apply behavior, or user activity. Do not allow skipping these.
🆕 = not in the screenshots (the reference product derives it from the CV); our app must ask or confirm it.

## Step 1 – Getting started

| # | Question | Type | Options |
|---|----------|------|---------|
| 1 🆕 ⭐ | Upload or import your CV | File upload | PDF / DOCX (needed before #6; skip if already captured at signup or in the `cvs` feature) |
| 2 | What's your current work status? | Single select | I'm unemployed · I'm employed · I'm self-employed / freelancing · I'm a student / looking for my first job |
| 3 ⭐ | How are you approaching your job search right now? | Single select | Actively searching · Open to opportunities · Just exploring |
| 4 🆕 ⭐ | Where are you based? | Country + city search | Free search; drives work-authorization country and suggested locations |

## Step 2 – Your goals

| # | Question | Type | Options |
|---|----------|------|---------|
| 5 ⭐ | What would help most right now? | Single select (cards) | Find roles worth my time · Tailor every application · Prepare screening answers · Apply within my rules |
| 6 | Here's the story your CV tells (confirmation) | Confirm | Summary generated from CV (title, experience, strongest evidence, recent outcome, skills) → "Yes, this sounds like me" |
| 7 🆕 ⭐ | Which roles are you targeting? | Multi select + search | Suggested from CV; searchable from the job titles list |
| 8 ⭐ | What's the minimum salary worth considering? | Slider + currency | $0 – $5,000,000+ (default $120,000), currency dropdown (USD default); "Just a starting point. You can adjust it later." |

## Step 3 – Preferences, location & fit

| # | Question | Type | Options | Shown when |
|---|----------|------|---------|-----------|
| 9 ⭐ | What kind of work are you open to? | Multi select | Full-time · Part-time · Contract | Always |
| 10 ⭐ | How would you like to work? | Multi select | Remote · Hybrid · On-site | Always |
| 11 ⭐ | Are you willing to relocate for a job? | Yes / No | Yes · No | Always |
| 12 ⭐ | Where would you like to work remotely? | Multi select + country search | Regions: North America, South America, Europe, Asia, Oceania, Africa · Anywhere in the world · Suggested country (e.g. UK) · search any country | Remote selected |
| 13 ⭐ | Which cities would you commute to? | City search (multi) | Free-text city search | Hybrid / On-site selected |
| 14 ⭐ | What's your work authorization status? | Single select | Per country (e.g. Oman): Citizen · Permanent Resident · Work Visa (employer-sponsored) · Authorized, no sponsorship needed · Not yet authorized | Always |
| 15 ⭐ | Select industry preference | Multi select + search | Open to any industry · searchable list (e.g. Information Technology & Telecommunications, Financial Services & Insurance) | Always |
| 16 | Do these opportunities fit your life? (confirmation) | Confirm | Summary of salary, employment type, working style, remote search, commute locations → "Approve my preferences" | Always |

## Step 4 – Guardrails

| # | Question | Type | Options |
|---|----------|------|---------|
| 17 ⭐ | Are there companies we should avoid? | Company search (multi, optional) | e.g. "Google"; empty allowed |
| 18 ⭐ | Application mode | Single select (shown as "Your guardrails are ready", editable) | Apply automatically inside my rules · 🆕 Review each application before sending (second option not visible in screenshots; confirm) |

> #5 "Apply within my rules", #17 and #18 only apply if JobHunter auto-applies. If it stays a pure CRM, drop them.

## Optional extras (not in screenshots)

Seniority / years of experience · Languages · Notice period / start date.

## Non-question screens

| Screen | Notes |
|--------|-------|
| "We're ranking roles against the rules you approved" | Loading / progress, no input |
| "Setting up your job search" | Loading with social-proof stats, no input (do not copy masked emails) |
| Choose your plan | Paywall: Starter / Pro / Pro+ plans, countdown discount, checkout |

## Data to store

- `cvFileId`, `cvSummaryConfirmed`
- `workStatus`, `searchIntensity`, `currentCountry`, `currentCity`
- `primaryGoal`, `targetRoles[]`, `minSalary`, `salaryCurrency`
- `employmentTypes[]`, `workModes[]`, `willingToRelocate`
- `remoteRegions[]` / `remoteCountries[]` / `remoteAnywhere`, `commuteCities[]`
- `workAuthorization` (+ country), `industries[]` / `anyIndustry`
- `excludedCompanies[]`, `applicationMode`
- `selectedPlan`

All answers (except CV confirmation) should be editable later in preferences.
