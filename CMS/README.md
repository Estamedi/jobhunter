# Tapinti CMS (Strapi 5)

Headless CMS for the Tapinti website (`website.tapinti`) — manages blog articles/videos in English, Persian, and Arabic.

## Run it

```bash
cd CMS
pnpm run develop     # dev mode with admin panel + auto-reload
```

Admin panel: <http://localhost:1337/admin> — create the first admin account on first launch.

Other commands: `pnpm run build` (build admin), `pnpm run start` (production mode, no watch).

## What's pre-configured

**Article** collection type (`src/api/article/`), with draft & publish and i18n enabled:

| Field | Type | Localized |
|---|---|---|
| `title` | string (required) | ✅ |
| `slug` | uid (from title) | — shared across locales |
| `excerpt` | text | ✅ |
| `content` | rich text (Markdown) | ✅ |
| `cover` | image | — |
| `youtubeUrl` | string | — |
| `kind` | enum: `article` \| `video` | — |
| `publishedDate` | date | — |

## One-time setup after first launch

1. **Locales** — Settings → Internationalization → add `fa` (Persian) and `ar` (Arabic) alongside the default `en`.
2. **Public read access** — Settings → Users & Permissions → Roles → Public → enable `find` and `findOne` on Article (so the website can fetch published posts without a token). Draft entries are never exposed.
3. Create an entry in Content Manager → Article, fill each locale via the locale switcher (top right), and **Publish**.

## Consuming from the website

```
GET http://localhost:1337/api/articles?locale=fa&populate=cover&sort=publishedDate:desc
GET http://localhost:1337/api/articles?filters[slug][$eq]=my-post&locale=en&populate=cover
```

Set the base URL in `website.tapinti` via an env var, e.g. `CMS_URL=http://localhost:1337`.

## Storage

- Database: SQLite at `.tmp/data.db` (dev). For production, set the `DATABASE_*` env vars to point at PostgreSQL — the same server that runs `backend.jobhunter`'s Postgres can host a second database.
- Uploaded media: `public/uploads/`.
- Secrets: `.env` (generated, not committed).
