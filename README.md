# JobHunter CRM

A production-ready Job Search CRM to track candidates, companies, job applications, interviews, and activities — built with ASP.NET Core 10 and React 19.

## Stack

| Layer | Technology |
|---|---|
| Backend | ASP.NET Core 10, Clean Architecture, MediatR, EF Core, ASP.NET Identity |
| Database | PostgreSQL 16 |
| Frontend | React 19, TanStack Router, TanStack Query, Shadcn UI, Tailwind CSS v4 |
| Deployment | Docker Compose |

---

## Option 1 — Docker Compose (recommended)

### Prerequisites

- Docker + Docker Compose

### Steps

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Build and start all services
docker compose up -d --build
```

| Service | URL |
|---|---|
| UI | http://localhost:8088 |
| Backend API | http://localhost:5289 |
| API Docs (Scalar) | http://localhost:5289/scalar |
| PostgreSQL | localhost:5434 |

On first start the backend automatically runs EF migrations and seeds demo data (4 candidates, 5 companies, 20 applications, 5 interviews, 10 activities).

```bash
# Stop
docker compose down
```

---

## Option 2 — Local development

### Prerequisites

- .NET 10 SDK
- Node.js 20+ and pnpm
- PostgreSQL running locally

### 1. Database

Start Postgres (or use Docker for just the DB):

```bash
docker compose -f docker-compose.postgres.yml up -d
```

> The default connection string in `backend.jobhunter/src/Web/appsettings.json` connects to `localhost:5432` with user `postgres` / password `Aman@123`. Edit it if your credentials differ.

### 2. Backend

```bash
cd backend.jobhunter
dotnet run --project src/Web
```

The backend starts at **http://localhost:5124** and automatically applies migrations and seeds demo data on first run.

API docs: http://localhost:5124/scalar

### 3. Frontend

```bash
cd ui.jobhunter
pnpm install
pnpm dev
```

UI: **http://localhost:5173**

The `.env.local` file is already configured to point to `http://localhost:5124`.

---

## First Login

Register an account (API or sign-in page):

```bash
curl -X POST http://localhost:5124/api/Users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"YourPassword@123"}'
```

Then open http://localhost:5173/sign-in and log in.

---

## Project Structure

```
jobhunter/
├── backend.jobhunter/          # ASP.NET Core 10 API
│   └── src/
│       ├── Domain/             # Entities
│       ├── Application/        # MediatR commands & queries
│       ├── Infrastructure/     # EF Core, Identity, seed data
│       └── Web/                # Minimal API endpoints
├── ui.jobhunter/               # React 19 frontend
│   └── src/
│       ├── features/           # Feature modules
│       ├── routes/             # TanStack Router file-based routes
│       └── lib/                # Axios HTTP client, cookies, utils
├── docker-compose.yml
└── .env.example
```

## Features

- **Dashboard** — stats, recent activities, upcoming interviews
- **Candidates** — track job seekers
- **Companies** — manage target companies
- **Contacts** — recruiters and hiring managers
- **Job Roles** — open positions with salary, work type, location
- **Applications** — full pipeline (Wishlist → Applied → Interviews → Offer/Rejected)
- **Follow-Ups** — overdue / due today / this week
- **Activities** — log calls, emails, meetings, notes
- **Interviews** — track rounds, interviewers, outcomes
- **Reports** — charts: monthly trend, by status, by candidate, conversion rates

---

## Useful Commands

```bash
# Add a new EF migration
cd backend.jobhunter
dotnet ef migrations add <Name> --project src/Infrastructure --startup-project src/Web

# Apply migrations manually
dotnet ef database update --project src/Infrastructure --startup-project src/Web

# Drop database (dev reset)
dotnet ef database drop --project src/Infrastructure --startup-project src/Web --force

# Frontend lint & build
cd ui.jobhunter
pnpm lint
pnpm build
```
