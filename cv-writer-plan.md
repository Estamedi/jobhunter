# Plan: AI CV Writer

## Where it lives
- **Backend:** a new `CvGeneration` slice in `Application`, next to `Cvs` and `JobExtraction`.
- **Frontend:** a new `features/cv-builder` folder with a route at `routes/_authenticated/cv-builder`.
- **Navigation:** a sidebar entry "CV Writer".
- **Entry points:**
  - A "Tailor CV" button on a job application.
  - A "Generate CV" button on a job role.
  - Both pre-fill the job title and job description.

## Reuse what exists
- `AiJobExtractionService` already handles the AI provider choice, API keys from server config, and schema-constrained JSON output. The CV writer follows the same pattern with a new `ICvGenerationAiService` and an `AiCvGenerationService` in `Infrastructure/AiCvGeneration`.
- Provider keys and options come from the existing AI config section, which gets a CV-specific model setting.
- `Cv` is currently just file metadata (`StorageKey`, `FileName`). Generated CVs are saved through the same upload and storage path, so they show up in the existing CV list and can be attached to applications through `CvId`.

## Backend
1. **Domain:** add `CvDraft : OwnedEntity` with these fields:
   - `CandidateId`
   - `Title`
   - `JobTitle`
   - `JobDescription`
   - `Instructions`
   - `ContentJson` (structured CV)
   - `TemplateId`
   - `SourceCvId`
   - `JobApplicationId`

   Add a migration.
2. **Input context:** the generator takes the candidate profile (experience, skills, education), optionally the text of an uploaded CV, the job title, the job description, free-text user instructions, tone and language.
3. **Commands and queries:**
   - `GenerateCvDraft`: calls the AI with a JSON schema (summary, experience bullets, skills, education) and saves a draft.
   - `RegenerateCvSection`: rewrites one section from the user's instruction.
   - `UpdateCvDraft`: saves manual edits.
   - `GetCvDrafts` and `GetCvDraft`.
   - `ExportCvDraft`: renders a PDF (QuestPDF, or HTML to PDF) and saves it as a regular `Cv`.
4. **Endpoint:** `Web/Endpoints/CvGeneration.cs`, authorized and mapped the same way as `JobExtraction`.
5. **Prompt:** put it in `CvGenerationPrompt.cs` with rules to stay grounded in the candidate's real data (never invent employers or skills), mirror keywords from the job description, and keep the output ATS-friendly.
6. **Limits:** rate-limit generation per user and cap the input size.

## Frontend
1. **Page layout:** the left side is an input form (job title, job description paste box or job-role picker, base CV selector, instructions, tone). The right side is a live CV preview with editable sections.
2. **Section actions:** "Regenerate section" and "Improve with instruction" on each section.
3. **Export:** download PDF, or "Save to my CVs".
4. **Data layer:** `api/` and hooks follow the other features (TanStack Query), and the route is registered with TanStack Router.
5. **Templates:** start with 1–2 CV templates.

## Phases
1. **MVP:** generate from job title and description, then edit and export to PDF.
2. **Application link:** attach the draft to a `JobApplication`, plus a match score and keyword gap view.
3. **Extras:** multiple templates, cover letter generation, version history, streaming generation.

## Open questions
- Which PDF approach do you want, server-side (QuestPDF) or client-side?
- Is the candidate profile data rich enough, or does it need new fields (experience, education)?
- Should generation stream, or is a single response fine for the MVP?
