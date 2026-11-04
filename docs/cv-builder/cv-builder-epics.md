# CV Builder Epics (by priority)

Source: `cv-builder-improvements.md`. Task numbers (for example 1.3) point to that file.

**Priority:** P0 = correctness or trust problem, fix first. P1 = clear quality win. P2 = polish or growth.

**Status:** ✅ = done and tested. 🟡 = partly done (see notes below). No icon = not done yet.

Farsi CVs (section 8 and task 9.10 of the source file) are out of scope for now.

## Summary

| Epic | Name | Priority | Tasks | Source section |
|------|------|----------|-------|----------------|
| E1 ✅ | Correctness and trust | P0 | 6 (+ 4.1, 9.1) | 1 |
| E2 | Job-description fit | P1 (9.1 is P0, 9.11 is P2) | 11 | 9 |
| E3 | ATS-friendliness | P1 (4.1 is P0) | 7 | 4 |
| E4 | Prompt and logic | P1 | 8 | 2 |
| E5 | Achievement discovery and user-claimed skills | P1 | 11 | 11 |
| E6 ✅ | User experience | P1 | 8 | 3 |
| E7 ✅ | Quality evaluation | P1 | 3 | 7 |
| E8 | Business rules | P1 and P2 | 5 | 6 |
| E9 | Professional look | P2 | 5 | 5 |
| E10 | AI chat via LibreChat (achievement interview) | P1 | 9 | new (L.x) |
| E11 | Mock interview | P2 | 7 | new (M.x) |
| E12 ✅ | Background CV generation (worker and live updates) | P0 | 8 | new (B.x) |

Epics E10 and E11 are new. Their tasks use the prefixes L (LibreChat) and M (mock interview) and are defined only in this file.

Reference only: section 10, "Architecture decision: technology choice" (plain pipeline, direct LLM calls, no LangChain, LangGraph later if needed, light RAG only if the profile grows).

## What each epic changes in the app

| Epic | Effect on the app | What changes |
|------|-------------------|--------------|
| **E1 Correctness and trust** (P0) | The CV never has a fake employer, school, date, or number. The AI cannot be tricked by text pasted into a job description. | Facts come from the profile, not from the AI. A checker rejects anything the user never entered. Nothing is cut silently. The ordering and model-ID bugs are fixed. |
| **E2 Job fit** | Each CV matches the job. The user sees what is missing. | The app reads the job description. It uses the job's wording and puts the most relevant bullets first. It lists must-have skills the user lacks. |
| **E3 ATS-friendliness** | Recruiter software reads the PDF correctly, so the CV is not rejected by a machine. | Standard headings, plain contact info, one date format, embedded fonts, a safe file name. A test reads the PDF back as an ATS would. |
| **E4 Prompt and logic** | Shorter CVs with better content that fits the job. | The AI uses the uploaded CV. It keeps to one page, picks only relevant items, and fails with clear messages. |
| **E5 Achievements and claimed skills** | Users who don't know what to write get help. They can also list skills they never used at work. | Each skill gets an evidence level. A guided interview asks questions and drafts bullets. The user confirms each fact before it is saved. |
| **E6 User experience** | The user can check, fix, and trust the result. | A profile check before generating, a keyword match score, undo and before/after on regenerate, version history, live hints, progress display, and Word export. |
| **E7 Quality evaluation** | Changes to the prompt or model can't make the CVs worse without anyone noticing. | A fixed set of test profiles and jobs, plus automatic scoring on every change. |
| **E8 Business rules** | Controlled cost, privacy, and reliability. | Rate limits, cost logs, a privacy notice, a fallback AI provider, and cheaper models for simple steps. |
| **E9 Professional look** (P2) | The CV looks better and prints well. | A second template, softer colors for print, good page breaks, and no photo by default. |
| **E10 AI chat via LibreChat** | Users talk to an AI interviewer inside the app, with no chat built from scratch. | LibreChat runs in the background. The backend calls it, saves the conversation per user, and adds a chat panel to the UI. |
| **E11 Mock interview** (P2) | Users practise for a real job and get feedback. | New interviewer agents (HR, technical, behavioral) reuse the E10 chat. A "Start mock interview" button on each application saves the feedback in the CRM. |

---

## P0

### E1. Correctness and trust ✅
**Goal:** The CV never contains a fact the user did not enter, and the generation process is safe and predictable.

- ✅ 1.1 Confirm the OpenAI model ID
- ✅ 1.2 Fix the ordering conflict (reverse-chronological)
- ✅ 1.3 Stop the model from producing hard facts (role, company, dates, degree)
- ✅ 1.4 Post-generation grounding check (`CvGroundingValidator`)
- ✅ 1.5 Remove silent truncation
- ✅ 1.6 Treat pasted text as untrusted (prompt injection)
- ✅ **Pulled in from other epics (P0):** 4.1 Round-trip ATS test, 9.1 Section regenerate loses language, tone and instructions

---

## P1

### E2. Job-description fit
**Goal:** Each CV is tailored to the job, and the user sees and fixes gaps.

- ✅ 9.1 Section regenerate keeps language, tone and instructions (**P0**, in E1)
- ✅ 9.2 Fill in the job description from the linked application
- ✅ 9.3 Warn when there is no job description
- ✅ 9.4 Target the job title and level
- ✅ 9.5 Order bullets by relevance inside each role
- ✅ 9.6 Use the job's own wording (checked on a live run: the job's own wording is kept and no acronyms were spelled out)
- 🟡 9.7 No copying and no keyword stuffing (copied-sentence check done in code; keyword cap is still a prompt rule; not run on section regenerate)
- ✅ 9.8 Keywords in context, not only in Skills (the eval reports must-have keywords in the text and in the skills list only)
- ✅ 9.9 Gap loop (most important for fit) (note: the rewrite covers the Skills section only)
- ✅ 9.11 Section order by job type (**P2**)
- ✅ 9.12 Fit score in the evaluation set (the eval reports must-have coverage, headline match and copied sentences)

### E3. ATS-friendliness
**Goal:** Every exported PDF is read correctly by ATS parsers.

- ✅ 4.1 Round-trip ATS test (**P0**, in E1)
- ✅ 4.2 Standard headings
- ✅ 4.3 Plain contact info (LinkedIn or the first link now sits in the header)
- ✅ 4.4 Embed fonts and set metadata (author, subject and keywords added to PDF and DOCX)
- 🟡 4.5 Consistent dates (dates of entries not linked to the profile are normalised; education stays year-only, hand edits are untouched)
- ✅ 4.6 No decorative bullets or justified text (PDF and DOCX)
- ✅ 4.7 Safe file name

### E4. Prompt and logic
**Goal:** Better, shorter, more useful CV content.

- ✅ 2.1 Use the uploaded CV
- ✅ 2.2 Length and style guidance
- 🟡 2.3 Extract the job description first (the extraction runs for the match report only; generation does not use it yet)
- 🟡 2.4 Select, do not dump (prompt only; live runs: 20 and 28 skills on the real profile, at most 14 on the fixtures, so the cap of 20 is not always followed)
- 2.5 Respect the language in headings
- 2.6 Version the prompt (later)
- 2.7 Tune the model call (later)
- ✅ 2.8 Fail clearly with friendly messages (the backend maps AI errors to friendly messages, and a failed draft shows its message with a "Try again" button)

### E5. Achievement discovery and user-claimed skills
**Goal:** Users who cannot describe their work still get strong bullets, and users can list skills they never used at work, with an evidence level they choose.

- ✅ 11.5 `EvidenceLevel` on skills and facts (start here) (on skills only; null means not set)
- ✅ 11.8 Level-aware wording (checked by the eval: a Project skill never appears in a bullet, and a Learning skill appears only in a "Currently learning" group)
- ✅ 11.9 Grounding check reads the profile (skills are now checked against the background)
- ✅ 11.6 "Where did you use it?" field (checked by the eval: the note on a Claimed skill reaches the CV, so the AI writes about it)
- 11.1 Guided achievement interview
- 11.3 Estimates allowed
- 11.2 Role-based question cards
- 11.7 Transferable-skill suggestions
- 11.4 "Small achievements count" hints
- 11.10 `userConfirmed` flag (deferred: every current input is user-entered or a reviewed import, so nothing would store "false". Do it with 11.1 and E10.)
- 11.11 Growth path (P2 inside the epic)

### E6. User experience ✅
**Goal:** The user can see, check and edit what the AI produced.

- ✅ 3.1 Profile completeness check before generating (the form warns about missing experience, skills, email, phone and location, each with a link to the profile; tested helper)
- ✅ 3.2 Keyword match report (job-fit tests)
- ✅ 3.3 Undo and diff on regenerate (Undo restores the saved version; the history dialog shows before and after; version tests and `cv-diff` tests)
- ✅ 3.4 Version history (version functional tests)
- ✅ 3.5 Edit-time hints (the editor shows hints under each bullet while typing: over 25 words, no number, an unclosed `**`, a weak opener; tested helper)
- ✅ 3.6 Progress while the AI works (writing panel with steps and elapsed time; checked in code, no test)
- ✅ 3.7 Entry points ("Tailor CV" on applications and "Generate" on job roles open the builder with the job filled in; checked in code, no test)
- ✅ 3.8 DOCX export (DOCX renderer test)

### E7. Quality evaluation ✅
**Goal:** Prompt and model changes are measured before they ship.

- ✅ 7.1 Fixed test profiles and job descriptions (six synthetic fixtures in `Eval/Fixtures/`: senior with 11 roles, thin profile, C# to Java career changer, Learning-level skill gap, tool on the wrong project, copyable long job)
- ✅ 7.2 Automatic scoring (`CvEvalRunTests` prints one table; hard gates are grounding, copied text, ATS round trip and the fixture rules; scoring logic has unit tests)
- ✅ 7.3 Run on every prompt or model change (compares with `Eval/baseline.json`; run only after very big CV-pipeline changes, as agreed, not on every change)

### E8. Business rules
**Goal:** Cost, privacy and reliability under control.

- ✅ 6.1 Rate limits and quotas (limits already existed; a rejected request now gets a clear message and a Retry-After time, tested)
- ✅ 6.2 Cost tracking (one log line per AI call with model, tokens and time and never the text, tested; Langfuse keys are set in production, so Langfuse is the cost source and no daily cost summary was built)
- 🟡 6.3 Privacy notice (postponed while the app is in testing: requests are logged again in full for debugging. Before launch, stop logging request contents in `UnhandledExceptionBehaviour` and `PerformanceBehaviour`, add a privacy-policy sentence about CV writing, and consider deleting old logs. The generate form already says what is sent to the AI provider)
- 🟡 6.4 Provider fallback (fallback on outage, quota and key errors is built and tested, but production has only an OpenAI key, so it changes nothing until a second key is added; the Anthropic path has never run live)
- ✅ 6.5 Model choice per step (extraction uses the cheaper model and CV writing the stronger one)

### E10. AI chat via LibreChat (achievement interview)
**Goal:** Use LibreChat only as the chat engine behind the achievement interview (E5, task 11.1). Users never open LibreChat. They talk to our own chat panel, and our backend calls LibreChat through its Agents API. Confirmed facts are saved in our profile data, not in LibreChat.

**Decisions:**
- LibreChat is used for the interview only. CV generation stays in our pipeline (structured profile, grounding check, QuestPDF). We do not use LibreChat RAG to build the CV.
- The Agents API is beta. Pin the LibreChat version and test every upgrade.
- **LibreChat stays fully separate from our app. Only its API is used.**
  - It runs as its own service with its own deployment, config and database. Its code and config do not live in our solution.
  - No shared database, no SSO or login link, no iframe, and no LibreChat page or component in our UI.
  - Our app talks to it only through one small adapter (L.4) that holds the base URL, API key and agent ID. If LibreChat is replaced, only the adapter changes.
  - LibreChat holds no profile data. Our backend sends the context for each request and keeps the confirmed facts in our own database.

- L.1 Deploy LibreChat as a separate service (internal, not public, outside our solution). Pin the version. Enable the Agents API and grant the Remote Agents permission to the role that owns the API key
- L.2 Create the "Achievement interview" agent with a system prompt: one short question at a time, skip allowed, ends with a drafted bullet (Action + Result + Number) as JSON
- L.3 Create an Agent API key and store it as a backend secret (the key is shown only once)
- L.4 Backend adapter (the only place that knows LibreChat): call `POST /api/agents/v1/chat/completions` with `model` = agent ID, bearer key, through a small interface (so the provider can be swapped). The newer `/api/agents/v1/responses` endpoint is an option
- L.5 Per-user conversation state in our database. Send each user's message history with every request, because the API key acts as one LibreChat user
- L.6 Send context with the first message: job or project picked, role, and a summary of the confirmed profile. Do not send email or phone (see 6.3)
- L.7 Parse the agent's JSON bullet. If invalid, ask the agent once to fix it, then show an error. Only save after the user clicks "Yes, this is true" (task 11.10)
- L.8 Chat panel component in our UI (one React component). Shows the conversation and the confirm or edit step
- L.9 Limits and monitoring: rate limit per user (6.1), cost logging (6.2), friendly error when LibreChat is down (2.8)

**Depends on:** 11.5 (`EvidenceLevel`) and 11.10 (`userConfirmed`) from E5.

### E12. Background CV generation (worker and live updates) ✅
**Goal:** A CV is written by a background worker, not inside the web request. One generation takes about a minute with `gpt-5.5`, and a retry doubles it, so a request held open was cut by the reverse proxy's 60-second default and no CV was saved (seen on the server on 2026-11-03).

- ✅ B.1 `CvDraft` has a status (Completed, Pending, Running, Failed) with the error, the stored warnings and the form notes. Old drafts read as Completed (migration `AddCvDraftGenerationStatus`)
- ✅ B.2 `POST /api/CvGeneration` only queues the draft and answers at once with 202 and a Pending draft
- ✅ B.3 `CvGenerationWorker` writes Pending drafts one at a time. Each is claimed with one atomic update, and it runs as the draft's owner so the per-user data filters work
- ✅ B.4 A restart in the middle of a write puts the draft back in the queue once, then marks it Failed
- ✅ B.5 A failed draft keeps a readable error, and `POST /api/CvGeneration/{id}/retry` queues it again
- ✅ B.6 Export, edit, regenerate, match, score and restore refuse a draft that is not Completed
- ✅ B.7 SignalR hub `/hubs/cv-generation` (WebSockets or long polling, token in the query string) tells the owner when a draft finishes
- ✅ B.8 (page not tested in a browser; only build, lint and helper tests ran) The CV builder shows a writing panel from the draft's status, polls every 4 seconds while a draft is being written (so it works without the hub), and tells the user when it finishes or fails

**Server setup (not part of the code):** to use WebSockets, `api.applyladder.com` needs a `location /hubs/` block with `proxy_http_version 1.1`, `Upgrade` and `Connection "upgrade"` headers and a long `proxy_read_timeout`. Without it the hub uses long polling, which works behind the default proxy. Other long calls (section regenerate, profile import) are still single requests of about a minute and can hit the 60-second limit until `proxy_read_timeout` is raised.

---

## P2

### E9. Professional look
**Goal:** Cleaner templates and design polish.

- ✅ 5.1 Second template: "Classic for print" and "Compact" were added next to "Classic", chosen in the draft header, with the preview following the choice (one layout and three styles in `CvStyle`; every template goes through the ATS round-trip tests; the page itself was not tested in a browser)
- 🟡 5.2 Tone the colours down: the "Classic for print" and "Compact" styles are near-black and all their text colours pass 4.5:1 contrast (tested), and the DOCX follows the template's colours. The classic blue heading is 3.56:1 on white, below 4.5:1; it was left as the owner's reference look
- ✅ 5.3 Page-break rules: a section moves to the next page rather than leave its heading alone at the bottom, and a role line stays with its first bullet. Tested on long CVs for every template, and the test fails when either rule is removed. DOCX already keeps headings and role lines with the next line
- ✅ 5.4 Photo-free by default: the classic, print and compact templates have no photo, and the preview says so
- ✅ 5.5 "With photo" template (new, asked for by the owner): the user uploads a photo on the profile page and picks "With photo" for a CV with the photo on the left, the name, a bold headline and labelled lines (Residence, Phone, Email, Availability, LinkedIn), and a QR code of the profile link on the right. Parts:
  - Profile: a Photo card (upload, change, remove) and a new Availability field. The browser crops the picture to 3:4, scales it to 600 x 800 and turns it upright, so the server gets a small JPEG. The server accepts only JPEG or PNG (checked from the file's bytes) up to 2 MB, keeps one photo per candidate in the database (not in file storage, which would lose it when the container is replaced), and only the owner can read, change or remove it.
  - PDF and Word: the photo and the QR code are pictures only. The name, contact lines and the link stay as text before "Summary", so an ATS reads the same text as for the other templates. A photo that cannot be read, or a missing photo or link, is left out and the export still works. The Word file uses floating pictures; its structure and schema were checked, but it was not opened in Word or LibreOffice.
  - The photo is read only when the draft uses the photo template, and it is never sent to the AI.
  - Tested: photo upload and rules, owner-only access, PDF and Word with and without photo and link, the ATS round trip and page-break tests for the new template, the full export from the database, the crop helper and the photo card. The PDF was also rendered and checked against the owner's screenshot. The preview shows a labelled box where the QR code goes, not a scannable one. The page itself was not tested in a browser.

### E11. Mock interview
**Goal:** Let users practise interviews for a specific application, using the same LibreChat chat engine and chat panel as E10.

- M.1 Create one agent per mode in LibreChat: HR interview, technical interview, behavioural (STAR) interview. Each has its own system prompt
- M.2 "Start mock interview" action on an application in the CRM. Pick the mode
- M.3 Send context with the first message: job description and a summary of the confirmed profile, so questions match the target job
- M.4 Reuse the E10 chat panel and backend client. Only the agent ID changes
- M.5 Final feedback as JSON (score, strong points, weak answers, tips). Store it with the application in the CRM
- M.6 Link weak answers back to the achievement interview, so the user can improve their profile (E5)
- M.7 Voice mode (later, only if the LibreChat version supports speech)

**Depends on:** E10.

---

## Suggested delivery order

1. E1 (with 4.1 and 9.1)
2. E2 core (9.2 to 9.6) and E3
3. E5 first half (11.5, 11.8, 11.9, 11.6, 11.10) and E4 core (2.1, 2.2, 2.8)
4. E10 (LibreChat chat) together with 11.1, then the rest of E5
5. E6 and E7
6. E8
7. E9, E11 (mock interview), then the "later" tasks
