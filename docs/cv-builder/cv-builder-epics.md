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
| E6 | User experience | P1 | 8 | 3 |
| E7 | Quality evaluation | P1 | 3 | 7 |
| E8 | Business rules | P1 and P2 | 5 | 6 |
| E9 | Professional look | P2 | 4 | 5 |
| E10 | AI chat via LibreChat (achievement interview) | P1 | 9 | new (L.x) |
| E11 | Mock interview | P2 | 7 | new (M.x) |

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
- 🟡 9.6 Use the job's own wording (prompt rule only, acronym over-expansion fixed in the prompt, check with the next live run)
- 🟡 9.7 No copying and no keyword stuffing (copied-sentence check done in code; keyword cap is still a prompt rule; not run on section regenerate)
- 🟡 9.8 Keywords in context, not only in Skills (match panel done; scoring waits for E7)
- ✅ 9.9 Gap loop (most important for fit) (note: the rewrite covers the Skills section only)
- ✅ 9.11 Section order by job type (**P2**)
- 9.12 Fit score in the evaluation set

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
- 🟡 2.4 Select, do not dump (skills cap and relevance order added to the prompt only, unverified until the next live run)
- 2.5 Respect the language in headings
- 2.6 Version the prompt (later)
- 2.7 Tune the model call (later)
- 🟡 2.8 Fail clearly with friendly messages (backend maps AI errors to friendly messages; a retry button exists in the match and score panels, not on a failed generation)

### E5. Achievement discovery and user-claimed skills
**Goal:** Users who cannot describe their work still get strong bullets, and users can list skills they never used at work, with an evidence level they choose.

- ✅ 11.5 `EvidenceLevel` on skills and facts (start here) (on skills only; null means not set)
- 🟡 11.8 Level-aware wording (background text tested; the two prompt rules are unverified until the next live run)
- ✅ 11.9 Grounding check reads the profile (skills are now checked against the background)
- 🟡 11.6 "Where did you use it?" field (the note field and the profile page are done and tested; whether the AI writes bullets from the note is prompt-only, unverified until the next live run)
- 11.1 Guided achievement interview
- 11.3 Estimates allowed
- 11.2 Role-based question cards
- 11.7 Transferable-skill suggestions
- 11.4 "Small achievements count" hints
- 11.10 `userConfirmed` flag (deferred: every current input is user-entered or a reviewed import, so nothing would store "false". Do it with 11.1 and E10.)
- 11.11 Growth path (P2 inside the epic)

### E6. User experience
**Goal:** The user can see, check and edit what the AI produced.

- 3.1 to 3.8 (see section 3 of the source file). Key tasks: 3.1, 3.2 (match and keyword report), 3.3. Later: 3.4, 3.8.

### E7. Quality evaluation
**Goal:** Prompt and model changes are measured before they ship.

- 7.1 Fixed test profiles and job descriptions
- 7.2 Automatic scoring
- 7.3 Run on every prompt or model change

### E8. Business rules
**Goal:** Cost, privacy and reliability under control.

- 6.1 Rate limits and quotas
- 6.2 Cost tracking
- 6.3 Privacy notice
- 6.4 Provider fallback
- 6.5 Model choice per step

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

---

## P2

### E9. Professional look
**Goal:** Cleaner templates and design polish.

- 5.1 to 5.4 (see section 5 of the source file)

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
