# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build
dotnet build

# Run (starts Aspire dashboard + PostgreSQL in Docker)
dotnet run --project src/AppHost

# Run all tests
dotnet test

# Run a specific test by name
dotnet test --filter "FullyQualifiedName~RequestLoggerTests"

# Run a specific test project
dotnet test tests/Application.FunctionalTests

# Scaffold a new command
dotnet new ca-usecase --name CreateJobApplication --feature-name JobApplications --usecase-type command --return-type int

# Scaffold a new query
dotnet new ca-usecase -n GetJobApplications -fn JobApplications -ut query -rt JobApplicationsVm

# Install scaffolding template if missing
dotnet new install Clean.Architecture.Solution.Template::10.8.0
```

The Aspire dashboard opens automatically when running. The API reference is at `/scalar`.

## Architecture

This is a [Clean Architecture](https://github.com/jasontaylordev/CleanArchitecture) solution (v10.8.0) targeting .NET 10. Dependency flow: `Web` → `Application` ← `Infrastructure`, `Domain` has no outward dependencies.

### Projects

| Project | Purpose |
|---|---|
| `src/Domain` | Entities, value objects, domain events, enums — no external dependencies |
| `src/Application` | CQRS use cases (MediatR), interfaces, validators (FluentValidation), DTOs (AutoMapper) |
| `src/Infrastructure` | EF Core + PostgreSQL, ASP.NET Identity, EF interceptors |
| `src/Web` | Minimal API endpoints, OpenAPI/Scalar, CORS, exception handling |
| `src/AppHost` | .NET Aspire orchestration; deploys to Azure Container Apps with Azure PostgreSQL Flexible Server |
| `src/ServiceDefaults` | Shared OpenTelemetry, health checks, service discovery config |
| `src/Shared` | Service name constants shared between AppHost and Web |

### CQRS Pattern

Each feature lives under `src/Application/{Feature}/Commands/` or `.../Queries/`. The command/query record and its handler are co-located in the same file. Validators go in a separate `*Validator.cs` file alongside them.

MediatR pipeline behaviours run in this order: `LoggingBehaviour` → `UnhandledExceptionBehaviour` → `AuthorizationBehaviour` → `ValidationBehaviour` → `PerformanceBehaviour`.

### Endpoints

Each endpoint group implements `IEndpointGroup` with a static `Map(RouteGroupBuilder)` method. `WebApplicationExtensions.MapEndpoints` auto-discovers all implementations and registers them at `/api/{ClassName}`. New endpoint groups are picked up automatically — no manual registration needed.

### Domain Events

Domain events are raised from entities (see `BaseEntity` and `BaseEvent`). `DispatchDomainEventsInterceptor` fires them after `SaveChangesAsync` via MediatR `INotification`.

### Authorization

Use the custom `[Authorize]` attribute on command/query classes (not the ASP.NET Core one). `AuthorizationBehaviour` in the MediatR pipeline enforces it. Authentication is Bearer token via ASP.NET Identity (`/identity/` endpoints auto-mapped by `AddApiEndpoints()`).

### Data Layer

`ApplicationDbContext` inherits from `IdentityDbContext<ApplicationUser>`. EF configurations are in `Infrastructure/Data/Configurations/`. `AuditableEntityInterceptor` auto-populates `Created`/`CreatedBy`/`LastModified`/`LastModifiedBy` on entities that extend `BaseAuditableEntity`.

In development, `InitialiseDatabaseAsync()` drops and recreates the DB on startup and seeds a default admin user (`administrator@localhost` / `Administrator1!`) and sample data.

### Package Management

All package versions are centrally managed in `Directory.Packages.props`. Do not specify versions in individual `.csproj` files.

## Test Projects

- `Domain.UnitTests` — value object and domain logic tests
- `Application.UnitTests` — MediatR behaviour and AutoMapper mapping tests (uses Moq)
- `Application.FunctionalTests` — full-stack tests via `WebApplicationFactory` against a real DB; `Respawn` resets DB state between tests; test classes inherit `TestBase`
- `Infrastructure.IntegrationTests` — infrastructure integration tests
- `TestAppHost` — Aspire test host used by functional tests

## Live CV test (real AI)

`tests/Application.UnitTests/Live/LiveCvGenerationTests.cs` runs the whole CV process on a real LinkedIn PDF with the real AI (`Explicit`, so it never runs by default). It costs money and takes about 2 minutes per job. Run it only after very big CV-pipeline changes (new prompt, model, schema, or generation flow), not after every change. Needs `CV_LIVE_OPENAI_KEY`; optional `CV_LIVE_PROFILE_PDF` and `CV_LIVE_OUT_DIR`. Run with `--filter "FullyQualifiedName~LiveCvGeneration"`.

## CV drafts are written in the background

`POST /api/CvGeneration` only queues a `CvDraft` (status Pending). `CvGenerationWorker` (Infrastructure/CvGeneration) writes it with `CvDraftGenerationService`, running as the draft's owner through `UserOverride` because there is no HTTP request. The owner is told over the SignalR hub `/hubs/cv-generation` through `ICvGenerationNotifier`; the UI also polls, so the hub is only a speed-up. Edit, export, regenerate, match, score and restore refuse a draft that is not Completed (`CvDraftGuard`). Functional tests replace the AI with `FakeCvAi` and still run the real worker and hub.
