# JobHunter CRM

JobHunter CRM is a full-stack project with a .NET backend and a React admin UI.

## Project Structure

- `backend.jobhunter/` - .NET 10 Clean Architecture backend, ASP.NET Core API, Aspire orchestration, PostgreSQL, Identity, OpenAPI/Scalar.
- `ui.jobhunter/` - React 19 + TypeScript + Vite dashboard using TanStack Router, TanStack Query, Shadcn UI, Tailwind CSS, Zustand, and Clerk integration.
- `LICENSE` - MIT license for the root project.

## Prerequisites

- [.NET SDK 10.0.201](https://dotnet.microsoft.com/download) or a compatible later feature band.
- Docker, required by the Aspire AppHost to run PostgreSQL locally.
- Node.js and pnpm for the UI.
- Playwright Chromium if you want to run UI browser tests.

## Backend

```bash
cd backend.jobhunter
dotnet build
dotnet run --project src/AppHost
```

The Aspire dashboard opens automatically and shows service URLs and logs. The API reference is available at `/scalar`.

Run backend tests:

```bash
cd backend.jobhunter
dotnet test
```

## Frontend

```bash
cd ui.jobhunter
pnpm install
pnpm dev
```

Optional Clerk configuration lives in `ui.jobhunter/.env.example`:

```bash
VITE_CLERK_PUBLISHABLE_KEY=
```

Build and check the UI:

```bash
cd ui.jobhunter
pnpm build
pnpm lint
```

Run UI tests:

```bash
cd ui.jobhunter
pnpm test:browser:install
pnpm test
```

## Useful Commands

```bash
# Backend
cd backend.jobhunter && dotnet build
cd backend.jobhunter && dotnet test
cd backend.jobhunter && dotnet run --project src/AppHost

# Frontend
cd ui.jobhunter && pnpm dev
cd ui.jobhunter && pnpm build
cd ui.jobhunter && pnpm lint
cd ui.jobhunter && pnpm test
```

## Documentation

More detailed notes are available in the subproject READMEs:

- `backend.jobhunter/README.md`
- `ui.jobhunter/README.md`

## License

This project is licensed under the MIT License. See `LICENSE` for details.
