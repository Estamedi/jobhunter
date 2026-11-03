# CV Builder Improvements

Follow-up to `cv-writer-plan.md`. It covers the process, logic, prompt, business rules, UX, ATS-friendliness and professionalism of the CV builder.

**Priority:** P0 = correctness or trust problem, fix first. P1 = clear quality win. P2 = polish or growth.
**"Verify"** = based on files not yet read in depth; confirm before starting.

## How it works today

1. `GenerateCvDraftCommandHandler` loads the candidate and builds a background text with `CvBackgroundBuilder` (profile plus the free-text notes).
2. `CvGenerationPrompt.BuildPrompt` builds one user message with the rules, job and background. `CvSchemaJson` constrains the output.
3. `AiJsonClient` calls OpenAI or Anthropic. The result is stored as `CvDraft.ContentJson`.
4. `QuestPdfCvRenderer` and `ClassicCvDocument` render a single-column A4 PDF.
5. `RegenerateCvDraftSection` already takes only the requested section from the AI result. Keep this.

---

## 1. Correctness and trust (P0)

| # | Task | Files | Done when |
|---|------|-------|-----------|
| 1.1 | **Confirm the OpenAI model ID.** `gpt-5.5` was set in `appsettings.json` but is unverified. Check it against OpenAI's models list and test one generation. | `Web/appsettings.json` | One CV generates without an OpenAI 404. |
| 1.2 | **Fix the ordering conflict.** The prompt says "most relevant experience first" but `CvBackgroundBuilder` sorts newest first. ATS parsers and recruiters expect reverse-chronological order. Change the rule to "keep reverse-chronological order; tailor which bullets lead and which are cut". | `CvGenerationPrompt.cs` | Generated experience is always newest first. |
| 1.3 | **Stop the model from producing hard facts.** Role, company, dates, degree and institution are model outputs, so they can drift or be invented. Pass each experience and education with an ID. The AI returns only headline, summary, bullets and skill selection per ID. The server merges these into the profile rows. | `CvGenerationPrompt.cs` (schema), `GenerateCvDraft.cs`, `CvDraftContent.cs`, `CvBackgroundBuilder.cs` | Employer, title and dates in a draft always match profile rows. |
| 1.4 | **Add a post-generation grounding check.** Reject or flag any employer, school, certification or date that is not in the profile. Flag numbers in bullets that are not in the background. Retry once, then show a warning. | new `CvGroundingValidator` in `Application/CvDrafts/` | A unit test with an invented employer fails the check. |
| 1.5 | **Remove silent truncation.** Fields are cut at 20,000 characters, which can drop older experience without telling the user. Truncate by section (oldest first), and return a warning to the UI. | `CvGenerationPrompt.cs` (`Truncate`), `GenerateCvDraft.cs` | The user sees a notice when input was cut. |
| 1.6 | **Treat pasted text as untrusted.** Move the rules to a system message. Wrap job description, instructions and background in delimiters and tell the model to ignore instructions inside them. | `CvGenerationPrompt.cs`, `AiJsonClient.cs` (system message support for both providers) | An injection test string in a job description does not change the output rules. |

## 2. Prompt and logic (P1)

| # | Task | Files | Done when |
|---|------|-------|-----------|
| 2.1 | **Use the uploaded CV.** `SourceCvId` is stored but its text is never sent. `ICvTextExtractor` exists. Add the extracted text to the background when the profile is thin, or when the user selects "base on this CV". | `GenerateCvDraft.cs`, `CvBackgroundBuilder.cs` | A candidate with an empty profile and a source CV gets a grounded draft. |
| 2.2 | **Add length and style guidance.** Target one page (two for 10+ years). Set 3-5 bullets per role (fewer for older roles) and a bullet length cap. Start bullets with strong verbs. Add "quantify only when the background contains the number". Avoid first person and filler words ("responsible for"). | `CvGenerationPrompt.cs` | Sample outputs stay within the limits. |
| 2.3 | **Extract the job description first.** Run a small step that pulls must-have skills, nice-to-haves, seniority and keywords from the job description. Feed that structure into the main prompt, and reuse it for the keyword report (3.2). | new prompt in `Infrastructure/AiCvGeneration/`, `GenerateCvDraft.cs` | The extraction result is stored and visible to the user. |
| 2.4 | **Select, do not dump.** Tell the model to rank and cut irrelevant roles, projects and skills. Cap skills at about 15 grouped items, ordered by job relevance. | `CvGenerationPrompt.cs` | Skills section only shows relevant items. |
| 2.5 | **Respect the language.** When `Language` is not English, translate headings through the renderer, not only the content. | `ClassicCvDocument.cs`, `CvTemplates.cs` | Headings match the chosen language. Verify the field is passed to the renderer. |
| 2.6 | **Version the prompt.** Add `PromptVersion` and `Model` to `CvDraft` so results are reproducible and comparable. Needs a migration. | `Domain/Entities/CvDraft.cs`, `Infrastructure/Migrations/` | Each draft shows which prompt and model produced it. |
| 2.7 | **Tune the model call.** Set a reasoning level for the OpenAI model if it supports one, and add a retry with backoff for 429 and 5xx. Verify. | `AiJsonClient.cs` | A transient 429 does not fail the request. |
| 2.8 | **Fail clearly.** Map AI errors ("declined", "cut off", "no provider") to user-readable messages, not raw exceptions. | `AiJsonClient.cs`, exception handler in `Web` | The UI shows a friendly message and a retry action. |

## 3. User experience (P1)

| # | Task | Files | Done when |
|---|------|-------|-----------|
| 3.1 | **Profile completeness check before generating.** Warn when experience, skills or contact details are missing, with a link to fix them. | `ui.jobhunter/src/features/cv-builder/index.tsx`, new query for completeness | The warning appears for an empty profile. |
| 3.2 | **Keyword match report.** Show matched and missing job-description keywords, and a match score (this was Phase 2 in `cv-writer-plan.md`). Compute from the extraction in 2.3. | new `GetCvDraftMatch` query, `cv-preview.tsx` | The report updates after edits. |
| 3.3 | **Undo and diff on regenerate.** Keep the previous section content and show before and after with accept or revert. | `RegenerateCvDraftSection.cs`, `cv-editor.tsx` | One click restores the previous version. |
| 3.4 | **Version history.** Store snapshots on each save or regenerate, with restore. | `CvDraft` or new `CvDraftVersion`, migration, UI | The user can open and restore an earlier version. |
| 3.5 | **Edit-time hints.** Highlight bullets that are too long, lack a verb or number, or contain `**` markers that do not close. | `cv-editor.tsx` | Hints appear live while typing. |
| 3.6 | **Streaming or progress.** Show progress during the AI call (a spinner with steps, or streaming). Verify the UI for existing loading states. | `cv-builder/api/index.ts`, `index.tsx` | The user never sees a frozen screen. |
| 3.7 | **Entry points.** Confirm the "Tailor CV" button on job applications pre-fills title and description. Verify. | `ui.jobhunter/src/features/` (applications) | One click opens the builder with the job filled in. |
| 3.8 | **DOCX export.** Many recruiters ask for Word. Export from the same structured content. | `Infrastructure/CvRendering/`, `ExportCvDraft.cs` | A DOCX opens cleanly with the same content. |

## 4. ATS-friendliness (P0 and P1)

The current layout is a good base: single column, no tables or images, text-based bullets, real hyperlinks.

| # | Task | Files | Done when |
|---|------|-------|-----------|
| 4.1 | **Round-trip ATS test (P0).** Render a PDF with `QuestPdfCvRenderer`, run `CvTextExtractor` on it, and assert that headings, reading order, contact details and dates survive. Both classes and their tests already exist. | `tests/Application.UnitTests/Infrastructure/QuestPdfCvRendererTests.cs` | The test passes in CI and fails when a heading is dropped. |
| 4.2 | **Use standard headings.** Rename "Professional Skills", "Recent Projects" and "Additional Information" to "Skills", "Projects" and "Additional Information" or "Links". Keep "Summary", "Experience", "Education", "Certifications". | `ClassicCvDocument.cs` | Headings match common ATS section names. |
| 4.3 | **Make contact info plain.** The header uses "Resident:", "Phone:" and "email:" labels. Use "Location", "Phone", "Email", and put the details in the page content, not a page header. Also add LinkedIn or portfolio there. | `ClassicCvDocument.cs` | The extracted text starts with name and contact details. |
| 4.4 | **Embed fonts and set metadata.** Confirm Lato is embedded and the PDF text is selectable. Set title, author and keywords in the metadata. | `ClassicCvDocument.cs` (`GetMetadata`), font registration | The PDF passes a text-extraction check and shows the metadata. |
| 4.5 | **Consistent dates.** Normalise to one format (for example "Jan 2022 - Present"). The AI returns free-form strings today. | `CvDraftContent.cs`, `ClassicCvDocument.cs` (`DateRange`) | All dates follow one format. |
| 4.6 | **Avoid decorative bullets and justified text.** Justified text can create odd spacing in extraction. Use left-aligned text. Verify against the 4.1 test. | `ClassicCvDocument.cs` | The extraction test shows no merged words. |
| 4.7 | **Safe file name.** Export as `Firstname-Lastname-CV.pdf`, not a generated ID. | `ExportCvDraft.cs` | The downloaded name is readable. |

## 5. Professional look (P2)

| # | Task | Files | Done when |
|---|------|-------|-----------|
| 5.1 | **Add a second template.** A compact variant, still single-column and ATS-safe. Choose by `TemplateId`. | `CvTemplates.cs`, new document class | The user can switch templates and preview. |
| 5.2 | **Tone the colours down.** The bright blue headings suit screens, not print or grayscale. Offer a neutral palette. | `ClassicCvDocument.cs` | A grayscale print stays readable. |
| 5.3 | **Page-break rules.** Do not split a role from its first bullet, and do not leave a heading at the bottom of a page. | `ClassicCvDocument.cs` | A long CV breaks cleanly across pages. |
| 5.4 | **Photo-free by default.** Keep it that way, and make that explicit in the UI. | UI copy | n/a |

## 6. Business rules (P1 and P2)

| # | Task | Files | Done when |
|---|------|-------|-----------|
| 6.1 | **Rate limits and quotas.** `cv-writer-plan.md` lists a per-user limit. Verify whether it exists. If not, add per-user daily limits for generate and regenerate. | `Web/Program.cs` or MediatR behaviour | Excess calls return a clear 429 with the reset time. |
| 6.2 | **Cost tracking.** Log model, tokens in and out, and latency per call. | `AiJsonClient.cs` | A log line per call, with a daily cost summary. |
| 6.3 | **Privacy.** The prompt already leaves out email and phone. Keep that. State in the UI and the privacy policy that profile data is sent to the AI provider. Check that no CV text is logged. | UI copy, `LoggingBehaviour` | Verified in code and legal docs. |
| 6.4 | **Provider fallback.** If the preferred provider fails, fall back to the other when both have keys. | `AiJsonClient.cs` | A forced OpenAI failure still produces a CV through Anthropic. |
| 6.5 | **Model choice per step.** Use a stronger model for generation and a cheaper one for extraction (2.3) and checks. | `AiExtractionOptions.cs`, `appsettings.json` | Each step has its own model setting. |

## 7. Quality evaluation (P1)

| # | Task | Done when |
|---|------|-----------|
| 7.1 | Build 5-10 fixed test profiles and job descriptions, including a thin profile, a career changer and a senior profile with many roles. | The set is stored in the test project. |
| 7.2 | Score each output automatically: grounding check (1.4), keyword coverage (3.2), length limits (2.2) and ATS round trip (4.1). | One command prints a score table. |
| 7.3 | Run it on every prompt or model change (2.6), and compare against the last version. | A prompt change shows its effect before merge. |

## 8. Farsi (Persian) CVs (P1)

`Language` is already a free-text field in `GenerateCvDraftCommand` and the prompt ("Language: {x}"), so the AI can write Farsi today. The renderer is the real gap. `ClassicCvDocument` is left-to-right and uses Lato, which has no Persian glyphs, so a Farsi PDF would show missing characters or reversed text.

| # | Task | Files | Done when |
|---|------|-------|-----------|
| 8.1 | **Make language a fixed choice.** Replace free text with a list (`en`, `fa`, later others) in the request, validator and UI. Store it on `CvDraft`. Needs a migration. | `GenerateCvDraft.cs`, `GenerateCvDraftCommandValidator.cs`, `CvDraft.cs`, `cv-builder/index.tsx` | Unknown language codes are rejected. |
| 8.2 | **Farsi prompt rules.** Write natural, professional Farsi (not word-for-word translation). Keep company names, technologies, URLs and emails in Latin script. Use Persian digits or Latin digits, one choice per CV. Keep the `**bold**` markers unchanged. Add the grounding rule again in the Farsi path. | `CvGenerationPrompt.cs` | A sample Farsi CV keeps names and tech terms in Latin and reads naturally. |
| 8.3 | **Embed a Persian font.** Add Vazirmatn or Noto Naskh Arabic, register it with QuestPDF, and use it when the language is `fa`. Check the font licence. | `Infrastructure/CvRendering/`, font file, `QuestPdfCvRenderer.cs` | Farsi text renders with no missing glyphs. |
| 8.4 | **Right-to-left layout.** Set `ContentDirection.RightToLeft` for the page, and mirror the date column, bullet position and alignment. Keep the header centred. Keep emails, URLs and phone numbers readable inside RTL text. | `ClassicCvDocument.cs` | The preview PDF has bullets on the right and dates on the left, with contact details intact. |
| 8.5 | **Translate headings and labels.** Move the hard-coded English headings ("Summary", "Experience", "Present", "Location") into a per-language dictionary. Farsi: خلاصه, سوابق کاری, تحصیلات, مهارت‌ها, پروژه‌ها, گواهینامه‌ها, زبان‌ها, تاکنون. Also needed for task 2.5. | `ClassicCvDocument.cs`, new `CvLabels.cs` | Headings and "Present" follow the CV language. |
| 8.6 | **Date format.** Decide between Gregorian (default, safer for international employers) and Jalali. Format month names per language. The AI returns free-form date strings today, so this depends on task 4.5. | `CvDraftContent.cs`, `ClassicCvDocument.cs` | Dates look consistent in a Farsi CV. |
| 8.7 | **RTL in the editor and preview.** Set `dir="rtl"` on the editable sections and preview when the language is `fa`, and align text correctly in mixed Farsi and English bullets. | `cv-editor.tsx`, `cv-preview.tsx` | Typing Farsi in a bullet behaves correctly. |
| 8.8 | **Farsi ATS round trip.** Extend task 4.1: render a Farsi PDF, extract the text with `CvTextExtractor`, and check that words are in logical order, not reversed or split into presentation forms. If extraction fails, change the font or shaping settings. | `QuestPdfCvRendererTests.cs` | Extracted Farsi text matches the source text. |
| 8.9 | **Farsi job descriptions and bilingual output.** Accept a Farsi job description for an English CV, and the reverse. Optional: generate both versions from one draft. | `CvGenerationPrompt.cs` | An English CV from a Farsi job description keeps the keywords. |
| 8.10 | **Farsi test fixtures.** Add Farsi cases to the evaluation set (7.1): a Farsi profile, a mixed-language profile, and a Farsi job description. | test project | The fixtures run in the scoring command (7.2). |
| 8.11 | **Check the AI model quality in Farsi.** Compare `gpt-5.5` and the Claude models on the same Farsi sample and keep the better one. | `appsettings.json` | A short comparison note is added. |

**ATS note:** many ATS systems parse Farsi poorly. For roles outside Iran, an English CV is usually safer. Show this hint in the UI when `fa` is selected, and offer the English version alongside.

## 9. Job-description fit (P0 and P1)

The job description is already used in tasks 2.3 (extract requirements), 2.4 (select, do not dump), 3.2 (keyword report) and 8.9 (Farsi and English job descriptions). This section fills the gaps. The principle: **fit the CV to the job without adding anything the candidate cannot back up.**

| # | Task | Files | Done when |
|---|------|-------|-----------|
| 9.1 | **Section regenerate loses language, tone and the original instructions (P0).** `BuildRefinePrompt` has no Tone or Language line, and `RegenerateCvDraftSection` sends only the per-section instruction, not `draft.Instructions`. A Farsi CV could come back in English, and any "emphasise X for this job" guidance is lost. Store `Tone` and `Language` on `CvDraft` (together with 8.1) and pass them, with the instructions, into the refine request and prompt. | `CvGenerationPrompt.cs` (`BuildRefinePrompt`), `RegenerateCvDraftSection.cs`, `CvSectionRefineRequest`, `CvDraft.cs`, migration | Regenerating a Farsi section returns Farsi, and keeps the job-specific instructions. |
| 9.2 | **Fill in the job description from the linked application (verify).** `JobDescription` is optional, and the handler only checks that `JobApplicationId` exists. `JobApplication` links to a `JobRole`, and the UI builds the text from the role's description and requirements (`lib/job-text.ts`). When `JobApplicationId` is set and the description is empty, load it on the server. Confirm the `JobRole` field names first. | `GenerateCvDraft.cs`, `Domain/Entities/JobRole.cs` (verify) | A draft created from an application is tailored even if the client sent no description. |
| 9.3 | **Warn when there is no job description.** Tell the user that a CV without one will be generic, and offer to paste one or pick a job role. | `cv-builder/index.tsx` | The warning shows when the description is empty. |
| 9.4 | **Target the job title and level truthfully.** The headline and summary should match the job's title and seniority wherever the background supports it, and stay honest where it does not. | `CvGenerationPrompt.cs` | The headline reflects the target role, with no claims beyond the profile. |
| 9.5 | **Order bullets by relevance inside each role.** Keep the roles in reverse-chronological order (task 1.2), but lead each role with the bullets that matter most for the job, and cut the least relevant first. | `CvGenerationPrompt.cs` | The top bullets of a role match the job's requirements. |
| 9.6 | **Use the job's own wording.** When a job term means the same as a background term ("Kubernetes" and "K8s"), use the job's term, and write the acronym and full form once. | `CvGenerationPrompt.cs` | The CV shows the exact terms the job uses. |
| 9.7 | **No copying and no keyword stuffing.** Forbid copying sentences from the job description. Add a check for verbatim job phrases in the output, and cap how often a keyword repeats. | prompt, `CvGroundingValidator` (task 1.4) | A test with a pasted job description fails the check when sentences are copied. |
| 9.8 | **Keywords in context, not only in Skills.** Matched keywords should appear in the summary or bullets, where ATS and recruiters weigh them. Measure this in the evaluation scoring (7.2). | `CvGenerationPrompt.cs`, evaluation set | The score reports how many matched keywords appear in experience bullets. |
| 9.9 | **Honest gap loop (most important for fit).** If the job has a must-have the background lacks, the model must not add it. The match report (3.2) lists it as missing with an "I have this, add it to my profile" action, then regenerates. This keeps fit and grounding (1.3, 1.4) working together. | `GetCvDraftMatch` (3.2), profile update flow, `cv-preview.tsx` | A missing skill added to the profile appears in the next generation. |
| 9.10 | **Farsi CV from an English job description.** Keep the job's keywords in Latin script so ATS matching still works. Extends 8.2 and 8.9. | `CvGenerationPrompt.cs` | The Farsi CV keeps technology terms from the job in Latin script. |
| 9.11 | **Section order by job type (P2).** `ClassicCvDocument` puts Projects before Experience. Make Experience first by default, and consider ordering sections per job type. | `ClassicCvDocument.cs` | Experience comes before Projects by default. |
| 9.12 | **Fit score in the evaluation set.** Add job-fit checks to 7.2: required-skills coverage, title match, and no copied sentences. | evaluation set | The scoring command prints a job-fit column. |

## 10. Architecture decision: technology choice

**Decision:** keep a plain, deterministic pipeline that calls the LLM directly (structured outputs, schema-validated). Do not adopt LangChain. Add LangGraph only if the flow later needs loops or human approval steps. Use RAG only in a light form (retrieval over the achievement bank) if the profile grows large.

Reliability comes from the design, not the framework:

1. **Master profile as structured data.** Every fact (roles, projects, achievements with metrics, skills, dates) lives in a schema and is the only source of truth. The model cannot invent anything. See 1.3.
2. **Parse the job description into a schema.** Extract required skills, seniority, keywords and responsibilities with schema-validated output. See 2.3.
3. **Select, do not write from scratch.** Rank and pick the profile facts most relevant to the job. If the profile fits in context, pass it all in with prompt caching. If it grows to hundreds of achievements, use embeddings plus a reranker. This is the only RAG needed, and it is a retrieval step, not a framework. See 2.4.
4. **Constrained rewriting.** The LLM rephrases only the selected facts. Each output bullet carries the ID of its source fact.
5. **Verification pass.** Code checks that every bullet maps to a source fact and that no new numbers, companies or skills appeared. An optional second LLM call acts as judge. Reject and retry on failure. See 1.4.
6. **Deterministic rendering.** Render with templates (QuestPDF here), never LLM-generated layout. Check ATS-friendliness and page length in code. See section 4.
7. **Human review.** Show a diff against the master profile before export.

Why not the others:

| Option | Verdict | Reason |
|--------|---------|--------|
| LangChain | Skip | Adds abstraction without adding reliability. The direct SDK plus typed schemas is simpler and easier to debug. |
| LangGraph | Later, only if needed | Useful for stateful loops (generate, verify, retry) and human-in-the-loop checkpoints. The pipeline is mostly linear, so a function with a retry loop is enough. |
| Full RAG (vector DB, chunking) | Skip for now | Overkill for one person's profile. Structured data plus an LLM beats retrieval over unstructured text. |

Add later: an evaluation set of job descriptions with expected outputs (section 7), and a record of which CV version went to which application in the CRM.

## 11. Achievement discovery and user-claimed skills (P1)

**Why:** many users do not know how to talk about their work, or do not know what counts as an achievement. Many also need to list skills they have never used at work (for example, an experienced C# developer who can now write Java with AI help). This is common today, so the app must cover it. The user decides what goes in their profile.

### 11.1 Guided achievement interview

| # | Task | Files | Done when |
|---|------|-------|-----------|
| 11.1 | **Interview flow.** The user picks a job or project. The AI asks short questions one at a time (daily tasks, problems solved, time or money saved, people taught or led, feedback received). It drafts a bullet (Action + Result + Number). The user edits or confirms it, and only then is it saved. | new `AchievementInterview` command and UI, `CvBackgroundBuilder.cs` | A user with an empty profile can create 3 confirmed bullets for one job. |
| 11.2 | **Role-based question cards.** Show example questions for the job title (for example, "How many tables did you handle per shift?"). They are questions, not ready-made claims. | question data file, UI | Each common role shows at least 5 questions. |
| 11.3 | **Estimates allowed.** If the user has no exact number, ask for a rough one and store it with an `isEstimate` flag. | profile model, UI | Estimated numbers are marked in the profile. |
| 11.4 | **"Small achievements count" hints.** Show examples of normal achievements so users do not skip them. | UI copy | Hints appear in the interview. |

### 11.2 User-claimed skills

| # | Task | Files | Done when |
|---|------|-------|-----------|
| 11.5 | **Add `EvidenceLevel` to skills and experience facts.** Values: `Worked`, `Project`, `Course`, `Learning`, `Claimed`. The user chooses the level. The app does not block any choice. Needs a migration. | `Domain/Entities`, `Infrastructure/Migrations/`, profile UI | Every skill shows its level, and the user can change it. |
| 11.6 | **Optional "Where did you use it?" field.** If filled, the AI uses it to write bullets. If empty, the AI writes only a skill line. | profile model, `CvBackgroundBuilder.cs`, `CvGenerationPrompt.cs` | A skill with context produces bullets. A skill without context produces a skills-section entry only. |
| 11.7 | **Transferable-skill suggestions.** From the profile, propose related skills (C# → Java, Kotlin). The user clicks "Add" and picks the level. | new suggestion service, UI | A C# profile shows Java as a suggestion. |
| 11.8 | **Level-aware wording.** The prompt gets each fact's level and writes in the user's chosen style (for example, `Worked` = normal bullets, `Project` = "project" wording, `Learning` = "currently learning"). `Claimed` is written as the user entered it. | `CvGenerationPrompt.cs` | Output wording follows the level for a mixed-level test profile. |
| 11.9 | **Grounding check reads the profile.** `CvGroundingValidator` (task 1.4) treats everything the user entered, at any level, as valid. It still rejects things the user never entered, such as an invented employer or skill. | `CvGroundingValidator` | A test with a user-added `Claimed` skill passes. A test with an invented skill fails. |
| 11.10 | **Keep `userConfirmed`.** Every fact and bullet records that the user confirmed it, so each claim traces back to the user's own input. | profile model | No AI-written fact is saved without confirmation. |
| 11.11 | **Growth path (optional, P2).** For `Learning` and `Project` skills, suggest a small next step (mini project, course). When done, the user can raise the level. | UI, suggestion service | Completing a step offers a level change. |

**Build order:** 11.5 → 11.8 → 11.9 → 11.6 → 11.1 → 11.3 → 11.2 → 11.7 → 11.4 → 11.10 → 11.11.

---

## Suggested order

1. **Week 1 (trust):** 1.1, 1.2, 1.5, 1.6, 4.1, 4.2, 4.3, 9.1
2. **Week 2 (grounding and fit):** 1.3, 1.4, 2.1, 2.2, 2.8, 9.2, 9.3, 9.4, 9.5, 9.6
3. **Week 3 (UX):** 3.1, 3.2, 9.9, 3.3, 2.3, 7.1-7.3, 9.7, 9.8, 9.12
4. **Farsi (after 4.1 and 4.5):** 8.1, 8.3, 8.4, 8.5, 8.2, 8.7, 8.8, then 8.6, 8.9-8.11
5. **Later:** 3.4, 3.8, 5.x, 6.x, 2.6, 2.7

## Open questions

- Should the AI be allowed to rewrite company and role names (for example normalise "Acme Ltd."), or must they stay exactly as in the profile? Task 1.3 assumes exact.
- Is DOCX export required, or is PDF enough?
- Is a per-user cost cap needed, or only rate limits?
