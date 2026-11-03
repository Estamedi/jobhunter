# Career Pivot Plan: reachable roles and the pivot CV

Follow-up to `cv-builder-improvements.md` and `cv-writer-plan.md`.

## The idea

With AI, people can learn a new skill much faster than before. A C# developer can pick up Java quickly, Rust in a few months, or mobile development in a short sprint. Today the CV builder only fits a user to roles they already match, so they miss roles they could reach.

Goal: show the user roles they could **reach**, explain the gap, and generate a CV that presents the pivot honestly.

## My recommendation

1. **Build a skill graph, not a job graph.** A role is a bundle of skills. How close two roles are should be computed from skill overlap, not stored as hand-written role-to-role links. Hand-written links go stale and can't explain themselves. A computed result can: "Java Backend: 70% covered through C#. Missing: Spring Boot, JPA. Estimated ramp: 2-4 weeks."
2. **Make it honest, or it backfires.** A C# developer who lists Java experience they don't have passes the ATS and fails the interview. This also breaks the grounding rule in `cv-builder-improvements.md` (tasks 1.3, 1.4 and 9.9: never invent skills). So the loop must be:

   ```
   find reachable roles -> see the gap and a ramp estimate -> follow a short learning plan
        -> record evidence (repo, course, certificate, small project) -> generate a CV that cites that evidence
   ```

   Task 9.9 (the honest gap loop) already does this for a single job description. This plan extends it to many roles.
3. **Show ranges and confidence, not promises.** "Mobile in one month" is optimistic for many people. Show a range, say what it assumes (hours per week, prior experience), and let the user adjust it.

## What exists today (checked in code)

| Area | Finding | Effect |
|------|---------|--------|
| `Domain/Entities/ProfileSkill.cs` | Only `Name`, `Category`, `SortOrder`. No proficiency, no evidence, no years. | Cannot tell "5 years of C#" from "just started Rust". First schema task. |
| `Domain/Entities/ProfileExperience` | Has a list of skill strings (used in `CvBackgroundBuilder`). Skills are not linked to `ProfileSkill`. | Skill evidence per role is free text. |
| `Domain/Entities/ProfileProject.cs` | Name, description, URL, dates. No skill list. | Projects cannot serve as evidence for a skill yet. |
| `Domain/Entities/JobRole.cs` | `Title`, `Description`, `Requirements` as free text. No structured skills. | Role requirements must be extracted before they can be compared. |
| `Domain/Entities/JobTitle.cs` | A catalog with `Name` and `Description` only. | Usable as the base for role families. Verify how it is populated. |
| `Application/Common/Interfaces/IJobExtractionAiService.cs` | `ExtractedJobDto` has no skills list. | Add one, so every saved posting yields required skills. |

## Graph model

Use Postgres through EF. A graph database is not needed at this size.

**Nodes**
- `Skill`: canonical name plus aliases ("C#" and ".NET", "Java" and "JVM", "K8s" and "Kubernetes"), a category (language, framework, platform, practice), and a family (JVM, mobile, systems).
- `RoleFamily`: a named role type ("Java Backend Developer", "Android Developer", "Rust Systems Engineer") with a weighted list of skills: must-have, important, nice-to-have.

**Edges**
- `SkillTransfer(from, to)`: a transfer score (0-1) and a ramp range in weeks, for example C# to Java is high, C# to Rust is medium (ownership and lifetimes are new), C# to Kotlin is high, C# to Flutter or Swift is medium.
- Each edge has a `Source` (curated or AI-proposed) and a `Reviewed` flag.

**How the score is calculated (deterministic and explainable)**
- For each role family, for each required skill: covered (user has it with evidence), transferable (user has a skill with an edge to it), or missing.
- Fit = weighted coverage of must-haves, then important, then nice-to-haves.
- Ramp estimate = the largest ramp among missing must-haves, adjusted by the user's weekly hours.
- An AI model may propose edges and role families, and a human reviews them. The runtime score never calls the model, so the same input always gives the same answer.

**Start small**
- Hand-curated seed in JSON: about 30-50 skills and 10-15 role families, starting with developer roles.
- A larger taxonomy (ESCO, O*NET) is a later option. Check its licence first. Verify.

## Pivot CV generation

### Modes

| Mode | When | Behaviour |
|------|------|-----------|
| Exact fit | Must-haves covered with evidence | Normal tailoring (existing flow, section 9 of `cv-builder-improvements.md`). |
| Stretch | Most covered, a few transferable or learning | Lead with strengths, mention transfers, list learning items separately. |
| Pivot | Several must-haves transferable or missing | Skills-first layout, open about the transition, projects and learning evidence up front. |

### Proficiency per skill

Add a level to every skill, used by the prompt and the layout:

- `Professional`: used at work (linked to an experience).
- `Project`: used in a personal or open-source project (linked to a project).
- `Learning`: in progress, with a start date and evidence (course, certificate, repo).

### Prompt rules for pivot mode

- The summary states the transition plainly: "Senior C# developer moving into Java backend, with a working Spring Boot project."
- Transferable skills are described as transferable (for example "REST API design, SQL, CI/CD, dependency injection patterns carry over from 8 years of .NET").
- Target keywords appear only where evidence exists.
- Everything else goes in a dated "Currently learning" section. An ATS reads it, and a human sees it is honest.
- No invented years of experience. No claim of professional use for `Project` or `Learning` skills.

### Layout

- A hybrid, skills-first format, with Projects before Experience in pivot mode. This reverses task 9.11 of `cv-builder-improvements.md` for this mode only.
- Keep it single-column, text-based and ATS-safe.
- Add the new labels ("Currently learning", "Transferable skills", "Projects") to the label dictionary (task 8.5, including Farsi).

### Grounding

- Update the grounding validator (task 1.4) to accept a `Learning` skill only when it has evidence, and a `Project` skill only when a project lists it.
- Keep the rule that role, company and dates come from profile rows (task 1.3).

### Cover letter

A pivot needs an explanation more than a normal application does. A pivot cover letter was already a Phase 3 item in `cv-writer-plan.md`. Move it up for pivot mode.

## Tasks

**Priority:** P0 = needed first, P1 = core feature, P2 = later. **"Verify"** = based on files not read in depth.

### Phase 1: data and reachable roles

| # | Task | Priority | Files | Done when |
|---|------|----------|-------|-----------|
| 1.1 | Add `Proficiency` (`Professional` / `Project` / `Learning`), `Years` and `EvidenceUrl` to `ProfileSkill`. Migration and mapping. | P0 | `Domain/Entities/ProfileSkill.cs`, `Infrastructure/Migrations/`, `Application/CandidateProfiles/CandidateProfileMapping.cs` | A skill can be saved with a level and evidence. |
| 1.2 | Link skills to experiences and projects with IDs instead of free text, or add a `Skills` list to `ProfileProject`. | P1 | `ProfileExperience.cs`, `ProfileProject.cs`, migration | A project can be shown as evidence for a skill. |
| 1.3 | Add `Skill`, `SkillAlias`, `SkillTransfer`, `RoleFamily` and `RoleFamilySkill` entities. Seed from JSON. | P0 | new `Domain/Entities/`, `Infrastructure/Data/Configurations/`, seed file | The seed loads about 30-50 skills and 10-15 role families. |
| 1.4 | Skill normalisation: map profile skills and job text to canonical skills using aliases first, and an AI step for unknown names. Cache results. | P1 | new `SkillNormalizer` in `Application/` | "K8s", "Kubernetes" and "k8s" all map to one skill. |
| 1.5 | Pivot scoring service: coverage, transferable, missing, fit score, ramp range. Deterministic, with unit tests. | P0 | new `Application/CareerPivot/` | The C# to Java example in the tests returns the expected gaps and ramp. |
| 1.6 | Query `GetReachableRoles`: ranked role families for the candidate, with covered, transferable and missing skills for each. | P0 | new query, new endpoint `Web/Endpoints/CareerPivot.cs` | The API returns a ranked list with explanations. |
| 1.7 | Reachable roles page: cards with fit, gaps, ramp range and a "Build a CV for this" button. Show confidence, not promises. | P1 | `ui.jobhunter/src/features/career-pivot/` (new) | The user sees reachable roles and the gap for each. |
| 1.8 | Let the user set weekly learning hours and a target date, and recompute the ramp estimate. | P2 | scoring service, UI | The estimate changes with the hours. |

### Phase 2: pivot CV mode

| # | Task | Priority | Files | Done when |
|---|------|----------|-------|-----------|
| 2.1 | Add `Mode` (exact, stretch, pivot) and `TargetRoleFamilyId` to `GenerateCvDraftCommand` and `CvDraft`. Migration. | P0 | `GenerateCvDraft.cs`, `CvDraft.cs` | A draft stores its mode and target. |
| 2.2 | Extend `CvBackgroundBuilder` to output skills with level and evidence, and a "Transferable skills" block computed from the graph. | P0 | `CvBackgroundBuilder.cs` | The background text shows level and evidence for each skill. |
| 2.3 | Pivot prompt (rules above), with a mode switch in `CvGenerationPrompt`. Keep the main rules unchanged. | P0 | `CvGenerationPrompt.cs` | A C# to Java sample reads honestly and names the transition. |
| 2.4 | Extend the CV schema with `learning` (name, since, evidence) and `transferableSkills`. Update `CvDraftContent` and the editor. | P1 | `CvGenerationPrompt.cs` (schema), `CvDraftContent.cs`, `cv-editor.tsx` | The new sections render and can be edited. |
| 2.5 | Pivot layout: skills-first, Projects before Experience, "Currently learning" section. | P1 | `ClassicCvDocument.cs`, `CvTemplates.cs` | The PDF shows the pivot layout in pivot mode only. |
| 2.6 | Update the grounding validator for learning and project skills. | P0 | `CvGroundingValidator` (task 1.4 of the first plan) | A learning skill without evidence is rejected. |
| 2.7 | ATS round trip for the pivot layout (extends task 4.1 and the Farsi test 8.8). | P1 | `QuestPdfCvRendererTests.cs` | Headings and order survive extraction. |
| 2.8 | Pivot cover letter generation. | P1 | new command and prompt | The letter explains the transition and cites the same evidence as the CV. |
| 2.9 | Farsi labels for the new sections (task 8.5). | P1 | label dictionary | The Farsi CV shows translated headings. |

### Phase 3: learning plan and evidence

| # | Task | Priority | Files | Done when |
|---|------|----------|-------|-----------|
| 3.1 | Learning plan per gap: ordered steps (learn, build, show) with time estimates. AI-written from the missing skills, constrained by the graph. | P1 | new command and prompt | The plan lists steps for each missing must-have. |
| 3.2 | Starter project ideas that prove the skill, matched to the target role. | P2 | prompt | The user gets a concrete project suggestion per gap. |
| 3.3 | Evidence capture: attach a repo URL, course certificate or project to a `Learning` skill. | P1 | `ProfileSkill`, profile UI | A learning skill with evidence moves from "gap" to "covered at project level". |
| 3.4 | Progress tracking: when evidence is added, recompute the fit and offer to regenerate the CV. | P2 | scoring service, UI | The fit score improves when evidence is added. |

### Phase 4: learn from real jobs

| # | Task | Priority | Files | Done when |
|---|------|----------|-------|-----------|
| 4.1 | Add `RequiredSkills` and `NiceToHaveSkills` to `ExtractedJobDto` and the extraction prompt. Store normalised skills on `JobRole`. | P1 | `IJobExtractionAiService.cs`, `JobExtractionPrompt.cs`, `JobRole.cs`, migration | Saving a posting stores its skills. |
| 4.2 | Build role-family requirements from saved postings (frequency of each skill across postings of the same title). Compare with the curated seed. | P2 | analysis job | Requirements reflect real postings in the user's market. |
| 4.3 | Show demand: how many saved or open postings match each reachable role. | P2 | query, UI | The list can be sorted by demand. |
| 4.4 | Let admins review and approve AI-proposed edges (the `Reviewed` flag). | P2 | admin UI | Unreviewed edges are marked in the output. |

## Risks and rules

- **Honesty is the product.** Never claim professional use for a skill the user has only learned. The grounding check (task 2.6) enforces this in code, not only in the prompt.
- **Ramp estimates are estimates.** Always show a range, the assumptions, and an "adjust" control.
- **Seed quality matters.** Wrong edges produce wrong advice. Start small, review by hand, and keep the source and reviewed flag visible.
- **Do not call the model at scoring time.** Scoring is deterministic and testable. The model only writes text and proposes edges.
- **Privacy.** The same rules as the main builder: profile data goes to the AI provider, so say so in the UI and the privacy policy.

## Open questions

- Which role families first? Suggested start: .NET, Java, Kotlin or Android, Rust, mobile (Flutter), frontend, data.
- Should the user pick a target role themselves, or only see suggestions? Suggested: both.
- Is a learning plan in scope, or only the CV? Phase 3 can be dropped without breaking phases 1-2.
- Are Persian-language courses and resources wanted in the learning plan?
