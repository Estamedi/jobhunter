# Plan: SEO and AI-agent visibility for ApplyLadder

Sites: `website.tapinti` (applyladder.com, Next.js) and `ui.jobhunter` (app.applyladder.com, Vite SPA).

The Next.js version in `website.tapinti` has breaking changes (see its `AGENTS.md`). Read `node_modules/next/dist/docs/` before touching metadata, `robots.ts`, `sitemap.ts` or route handlers.

## Phase 1: Fix what's broken (about 1 day) — DONE except 4 (partly) and 5, see notes

**applyladder.com**
1. Add `src/app/[locale]/opengraph-image.tsx` (1200x630, localized). Add `images` and alt text to `openGraph` and `twitter` in `generateMetadata`.
2. Remove `aggregateRating` from `structured-data.tsx`. Replace the invented testimonials and stats with real ones, or remove those sections.
3. Fix metadata:
   - Add `x-default` to `alternates.languages`, pointing to `/en`.
   - Use proper OG locales (`en_US`, `fa_IR`, `ar_AR`) plus `alternateLocale`.
   - Drop the `keywords` array.
   - Give `sitemap.ts` real `lastModified` dates.
4. Replace the `#top` fallback footer links with real pages (about, privacy, terms, contact).
5. Check the 307 locale redirect. Serve a clean 200 on `/` with `x-default`, or use a 308.

**app.applyladder.com**
6. Add `public/robots.txt`. It allows crawling on purpose, so crawlers can see the `noindex` and drop already-indexed app URLs.
7. `noindex` on the whole app: `X-Robots-Tag` header from nginx plus a `<meta name="robots">` in `index.html`.
8. Remove the hardcoded canonical and OG tags from `index.html`, or set them per route. Add per-route `document.title`.
9. Make the nginx `try_files` fallback return a real 404 for unknown paths such as `/robots.txt`, instead of the SPA with a 200.

## Phase 2: AI-agent readiness (about 1-2 days)

10. `robots.ts`: explicitly allow the AI search and user-agent crawlers: `OAI-SearchBot`, `ChatGPT-User`, `GPTBot`, `ClaudeBot`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`. Decide on `GPTBot`, `ClaudeBot` and `Google-Extended` separately, because those are the training crawlers.
11. `/llms.txt`: route handler with a short product summary and links to the key pages. Add `/llms-full.txt` with the full text of the content pages.
12. Markdown mirrors: serve `/<locale>/<page>.md` (or content negotiation on `Accept: text/markdown`) for every public page.
13. Make the content self-contained in the HTML:
    - Server-render all text. Don't hide key claims behind `opacity:0` reveal animations or JS-only tabs, and don't put them in images.
    - One clear h1 per page, a logical h2/h3 hierarchy, real `<ul>`, `<table>` and `<dl>` for features, pricing and comparisons.
    - A plain-text "What is ApplyLadder / who it's for / pricing / limits" block that an LLM can quote.
14. Structured data expansion:
    - `SoftwareApplication` with `featureList`, `screenshot`, accurate `offers`, `inLanguage` and `logo`.
    - `Organization` with `sameAs`, `logo` and `contactPoint`.
    - `WebSite` and `BreadcrumbList`.
    - `FAQPage` and `HowTo` where the content really is that.
    - All values factual and matching the visible page.
15. Stable, citable facts: one page with pricing, plan limits, supported languages, data and privacy policy, and a changelog. Keep the numbers identical everywhere.
16. Agent actions (optional, later): document the API (`api.applyladder.com`) with an OpenAPI file, and consider an MCP server for tracking applications.

## Phase 3: Content that earns rankings (ongoing, starts in week 2)

17. Build the English pages first, then translate. Each page gets a unique title, meta description, h1, FAQ block, internal links, a sitemap entry and `BreadcrumbList` schema:
    - `/job-application-tracker`
    - `/job-search-crm`
    - `/resume-tracker` and `/interview-tracker`
    - `/job-application-tracker-spreadsheet-template` (downloadable template, CTA to sign up)
    - `/compare/notion-vs-applyladder`, `/compare/spreadsheet-vs-applyladder`
18. Add a `/blog` or `/guides` section: follow-up email templates, how to track recruiters, interview prep checklists. Each guide answers one question directly in the first paragraph.
19. Do the same for Persian and Arabic where there is search demand. No unreviewed machine translation.
20. Publish a public changelog and an `/about` page with named authors (E-E-A-T, and an entity for AI systems to cite).

## Phase 4: Measure and distribute (start now, continue)

21. Verify both domains in Google Search Console and Bing Webmaster Tools, and submit the sitemap. Bing matters because ChatGPT search uses it.
22. Add privacy-friendly analytics and track the referrers `chatgpt.com`, `perplexity.ai` and `claude.ai`.
23. Run Lighthouse and PageSpeed. Target LCP under 2.5s: trim font families (three right now, Vazirmatn is heavy for non-English locales) and make the hero animation non-blocking.
24. Get listed and cited: Product Hunt, AlternativeTo, G2/Capterra, relevant subreddits, and "best job tracker apps" roundups.
25. Re-check monthly: indexed pages, impressions for target keywords, and whether AI assistants recommend ApplyLadder for "best job application tracker".

## Order of work
Phase 1 (items 1-9), then items 10-14 from Phase 2, then the first three content pages from Phase 3. Items 21 and 22 can be done in parallel at any time.

## Phase 1 notes
- Item 2: Testimonials and Stats sections removed from the home page (components deleted, message keys left in `messages/*.json`). Re-add only with real data.
- Item 4: dead footer links (roadmap, blog, about) and the placeholder social links (generic github.com / linkedin.com / twitter.com) removed. Add them back when real pages and profiles exist.
- Item 5: not changed. next-intl issues the locale redirect as 307; `x-default` now covers the root.
- Item 8: per-route titles are derived from the first path segment (`/job-roles` becomes "Job Roles · ApplyLadder").
