# CV Writing Guidelines

Core logic adapted from [dabydat/resume-builder-skill](https://github.com/dabydat/resume-builder-skill)
(`skill/SKILL.md`, MIT License, Copyright (c) 2025). Keep this attribution when reusing.

## 1. 📋 Request types

| Request | Action |
|---|---|
| Create resume from scratch | Full build (steps 1-6) |
| Improve / optimize | Analyze, then rewrite bullets |
| Tailor to a job description | Extract keywords, map to real experience |
| Review resume | Audit against the pre-delivery checklist |
| Multiple versions | 1-page, 2-page, or language variants |

Out of scope: LinkedIn optimization, portfolio sites, unrelated document formatting.

## 2. 🗂️ Step 1 - Gather information

- Work history
- Technical skills
- Education
- Projects
- Target market: US/international, LATAM/Spain, or both
- Target roles
- Page preference

⚠️ **Critical:** for every role, ask for domain context: industry, data sensitivity, end users, and business impact.

## 3. 🏗️ Step 2 - Structure

Single column, in this order:

1. Name and contact (centered)
2. Technical Skills
3. Professional Experience (reverse chronological)
4. Projects
5. Education (at the bottom for experienced professionals)

## 4. ✍️ Step 3 - Content (bullets)

Use the XYZ formula:

> Accomplished **[X]** as measured by **[Y]** by doing **[Z]**

- Every bullet should carry a measurable result.
- Avoid superfluous verbs such as "spearheaded" and "leveraged".
- Tailoring: extract keywords from the job description and map them only to experience the candidate really has (ATS matching).

## 5. 🎨 Step 4 - Format

| Item | Spec |
|---|---|
| Font | Calibri (we use Carlito, metric-compatible) |
| Body | 10.5pt |
| Name | 16pt |
| Section headings | 11.5pt |
| Margins | 0.75in |
| Line spacing | about 13pt |
| Layout | Single column, no tables for layout, no graphics |
| Links | Clickable email / GitHub / LinkedIn |

Implemented in `backend.jobhunter/src/Infrastructure/CvRendering/ClassicCvDocument.cs`.
Deviation from the skill: coloured headings and company names are kept.

## 6. 📄 Step 5 - Output

- Produce DOCX and PDF; the PDF must be generated from the final document.
- Verify the PDF text is extractable (`pdftotext`) and check page count (`pdfinfo`).

## 7. 🌍 Language rules

- **English:** active voice, no personal pronouns, US spelling for US roles.
- **Spanish:** strong action verbs (Desarrollé, Implementé, Lideré, ...).
- Bilingual versions are adapted, never literal translations.

## 8. ✔️ Pre-delivery checklist

- [ ] Format: matches the spec above, single column, no graphics
- [ ] Content: XYZ bullets with metrics, no filler verbs, keywords matched to the target role
- [ ] Delivery: PDF generated from the final document, text extractable, both files delivered

## ⚠️ Not covered

The skill's four reference files (`format-and-structure.md`, `bullet-writing-guide.md`,
`ats-and-keywords.md`, `common-mistakes.md`) were not reviewed when this file was written.

## 📊 Status in our app

Legend: ✅ done · 🟡 partial · ❌ not done

Checked against `backend.jobhunter/src` (Application/CvDrafts, Infrastructure/AiCvGeneration, Infrastructure/CvRendering).

| Skill part | Status | Where |
|---|---|---|
| Request: create from scratch | ✅ Done | `GenerateCvDraft`, `CvGenerationPrompt.cs` |
| Request: tailor to job description | ✅ Done | Prompt mirrors job keywords; `CvJobMatcher.cs`, `AnalyzeCvDraftMatch` |
| Request: improve one section | ✅ Done | `RegenerateCvDraftSection` |
| Request: review / audit | ✅ Done | `CvScoring/*` (action verbs, buzzwords, tense, dates, repetition, readability, quantify impact, skills, weak roles) |
| Request: multiple versions | 🟡 Partial | `CvVersioning.cs`, `RestoreCvDraftVersion`; no 1-page / 2-page variant switch (only `CvLengthGuide.cs`) |
| Step 1: intake of history, skills, education, projects | ✅ Done | Candidate profile, uploaded CV text, `CvBackgroundBuilder.cs`, `CvProfileMerger.cs` |
| Step 1: per-role domain-context questions | ❌ Not done | Not asked anywhere |
| Step 1: target market / page preference | 🟡 Partial | Language and tone are free text; no market field |
| Step 2: single column, centered header | ✅ Done | `ClassicCvDocument.cs` |
| Step 2: section order Skills, Experience, Projects, Education | ✅ Done | `ClassicCvDocument.cs` (we also keep a Summary first) |
| Step 3: strong action verbs, no first person, no filler | ✅ Done | Prompt rule, plus scoring checks |
| Step 3: XYZ formula | ❌ Not done | Prompt only asks for a strong verb and a number if the data has one; XYZ is not named |
| Step 3: never invent facts | ✅ Done (beyond the skill) | Prompt rules, `CvGroundingValidator.cs` |
| Step 3: banned verbs ("spearheaded", "leveraged") | ❌ Not done | Not enforced in the prompt; "Spearheaded" appears in your current CV |
| Step 4: font, size, margins, no tables or graphics | ✅ Done | `ClassicCvDocument.cs` (Carlito 10.5pt, 0.75in); coloured headings kept on purpose |
| Step 4: clickable links | ✅ Done | Hyperlinks for project and profile URLs; the header shows email as plain text |
| Step 5: PDF output | ✅ Done | `ExportCvDraft`, `QuestPdfCvRenderer.cs` |
| Step 5: DOCX output | ✅ Done | `DocxCvRenderer.cs`, `format=docx` on export, "Export DOCX" button |
| Step 5: verify text extractable / page count | ❌ Not done | No post-export check |
| Language: English rules | 🟡 Mostly done | Prompt avoids first person; no US-spelling rule |
| Language: Spanish verbs / non-literal translation | ❌ Not done | Language is free text only |
| Pre-delivery checklist | 🟡 Partial | Covered by `CvScorer` scoring, not as a gate before export |
