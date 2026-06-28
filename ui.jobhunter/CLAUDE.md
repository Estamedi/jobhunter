# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev                    # Start dev server
pnpm build                  # Type-check + Vite build
pnpm lint                   # ESLint
pnpm format                 # Prettier (--write)
pnpm format:check           # Prettier (--check)
pnpm knip                   # Find unused exports/dependencies
pnpm test:browser:install   # One-time: install Playwright Chromium (required before tests)
pnpm test                   # Run all tests (headless browser, single run)
pnpm test:watch             # Run tests in watch mode
pnpm test:coverage          # Run tests with coverage report
```

To run a single test file:
```bash
pnpm vitest run src/features/tasks/components/tasks-mutate-drawer.test.tsx --browser.headless
```

## Architecture

**Stack:** React 19 + TypeScript + Vite, TanStack Router (file-based), TanStack Query, Shadcn UI (Tailwind v4 + Radix UI), Zustand, Zod, React Hook Form, Sonner (toasts), Recharts, Axios.

### Routing

Routing is file-based via `@tanstack/router-plugin`. **`src/routeTree.gen.ts` is auto-generated — never edit it manually.** The dev server regenerates it on file changes.

Route structure:
- `src/routes/__root.tsx` — root layout (QueryClient context, Toaster, devtools)
- `src/routes/_authenticated/` — protected pages; the layout guard lives in `route.tsx` → `AuthenticatedLayout`
- `src/routes/(auth)/` — sign-in, sign-up, OTP, forgot-password (unauthenticated)
- `src/routes/(errors)/` — error pages (401, 403, 404, 500, 503)
- `src/routes/clerk/` — Clerk-specific auth/user-management routes (parallel auth integration)

### Provider Tree

Providers wrap the app in `src/main.tsx` in this order (outer to inner):
`QueryClientProvider` → `ThemeProvider` → `FontProvider` → `DirectionProvider` → `RouterProvider`

Inside authenticated routes: `SearchProvider` → `LayoutProvider` → `SidebarProvider`

### Features

Page-level logic lives under `src/features/<name>/` with subdirectories for `components/`, `data/` (schemas, mock data), and colocated `.test.tsx` files. The route file imports from the feature's `index.tsx`.

### State Management

- **Auth:** Zustand store (`src/stores/auth-store.ts`) — access token + user persisted in cookies. On 401, `QueryCache.onError` resets auth and redirects to `/sign-in`.
- **Layout:** `LayoutProvider` context persists sidebar variant/collapsible mode to cookies (7-day TTL).
- **Tables:** `useTableUrlState` hook (`src/hooks/`) syncs TanStack Table pagination and filters to URL search params.

### Component Libraries

- `src/components/ui/` — Shadcn components. **Excluded from ESLint.** Several are customized for RTL and other tweaks (see README); do not blindly overwrite with `npx shadcn@latest add`.
- `src/components/data-table/` — reusable TanStack Table primitives (toolbar, pagination, column-header, faceted-filter, bulk-actions, view-options).
- `src/components/layout/` — app shell (sidebar, header, nav-group, nav-user, team-switcher).

### Path Alias

`@` resolves to `src/`. Always use `@/...` for project imports.

### Testing

All tests run in a real Chromium browser via Vitest + Playwright (`vitest-browser-react`). Use `render` from `vitest-browser-react` and `userEvent` from `vitest/browser` in component tests. Cookie helpers for test isolation are in `src/test-utils/cookies.ts`.

### ESLint Rules to Know

- `no-console` is an **error** — use `if (import.meta.env.DEV) console.log(...)` where dev logging is needed.
- TypeScript type-only imports must use the `type` keyword (`import { type Foo } from '...'`).
- `src/components/ui` is excluded from ESLint checks.

### Adding a New Font

1. Add the font name to `src/config/fonts.ts`
2. Add Google Fonts `<link>` to `index.html`
3. Add `--font-<name>` CSS variable under `@theme inline` in `src/styles/index.css`

### Shadcn Components with RTL Customizations

When updating these via the Shadcn CLI, manually merge changes to preserve RTL support: `alert-dialog`, `calendar`, `command`, `dialog`, `dropdown-menu`, `select`, `table`, `sheet`, `sidebar`, `switch`. Also hand-merge: `scroll-area`, `sonner`, `separator` (general modifications beyond RTL).
