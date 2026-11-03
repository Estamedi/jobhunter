# Action verbs: research for CV scoring and CV generation

Sources read (blog posts, not research studies):

- Resume.io, "300 powerful resume action verbs": https://resume.io/blog/300-powerful-resume-action-verbs
- Enhancv, "Resume action verbs": https://enhancv.com/blog/resume-action-verbs/

Sections 1 to 7 are the summary and the analysis. Section 8 has every verb list from both pages, and the same data is in code as `ActionVerbData.cs`. Both pages are marketing blog posts, so treat the lists as ideas, not as tested research.

Related code:

- Scoring: `backend.jobhunter/src/Application/CvDrafts/CvScoring/` (one file per check, `CvScorer.cs` adds them up)
- Generation prompts: `backend.jobhunter/src/Infrastructure/AiCvGeneration/CvGenerationPrompt.cs`
- Job skill matching: `backend.jobhunter/src/Application/CvDrafts/CvJobMatcher.cs`

---

## 1. What Resume.io says

Core idea: strong action verbs show what you achieved, not just what you were responsible for. Pair each verb with a measurable result.

### 15 verb categories (about 20 verbs each)

| # | Category | Sample verbs |
|---|---|---|
| 1 | Leadership | Chaired, Directed, Spearheaded, Oversaw |
| 2 | Achievement | Accelerated, Outperformed, Boosted, Maximized |
| 3 | Teamwork | Contributed, Fostered, Partnered, United |
| 4 | Communication | Articulated, Briefed, Persuaded, Documented |
| 5 | Project management | Executed, Deployed, Forecasted, Overhauled |
| 6 | People management | Mentored, Delegated, Empowered, Trained |
| 7 | Customer service | Resolved, Advised, Negotiated, Supported |
| 8 | Problem-solving | Debugged, Identified, Rectified, Troubleshot |
| 9 | Improved (synonyms) | Enhanced, Optimized, Restructured, Transformed |
| 10 | Researched (synonyms) | Analyzed, Examined, Quantified, Scrutinized |
| 11 | Organization | Implemented, Maintained, Ensured, Upgraded |
| 12 | Creativity | Designed, Crafted, Conceptualized, Invented |
| 13 | Worked-on (synonyms) | Coordinated, Collaborated, Initiated, Refined |
| 14 | Increased (synonyms) | Doubled, Drove, Surpassed, Multiplied |
| 15 | Reduced (synonyms) | Eliminated, Minimized, Slashed, Streamlined |

### Rules

- Start every bullet in the work experience section with a strong action verb.
- Replace generic phrases ("responsible for", "worked on") with verbs that show ownership.
- Focus on results, not duties.
- Quantify: percentages, revenue, time saved.
- Vary verbs. Do not repeat one verb across bullets. Avoid overusing generic ones such as "managed".
- Match the job description: mirror relevant verbs, only where they are true.
- Use active voice.
- Use verbs in the summary too, aimed at the target job.
- Keep language natural. If a word feels forced or unfamiliar, do not use it.
- Match the verb to the type of work: "optimized" or "streamlined" for improvements, "assisted" or "facilitated" for support roles.
- Nothing is said about verb tense.

### Weak versus strong examples

| Weak | Strong |
|---|---|
| Responsible for managing projects | Led cross-functional projects delivering results 15% ahead of schedule |
| Worked on customer issues | Resolved 100+ customer issues per week with 95% satisfaction rate |
| Helped improve sales | Increased sales by 25% through targeted outreach |
| Responsible for managing a team | Led a 10-person team to deliver projects 20% faster |
| Project was completed in two months. (passive) | Completed the project in two months. (active) |

### Verb suggestions by role type

- Management: led, coached, mentored, directed
- Sales: generated, exceeded, closed, boosted
- Technical: built, engineered, debugged, optimized
- Customer service: resolved, assisted, advised, handled
- Creative: designed, developed, conceptualized

---

## 2. What Enhancv says

Core idea: action verbs (power or skill verbs) describe what you did and convey initiative and impact. They replace vague phrasing and make achievements measurable.

### How the lists are organised

- **Top 20 verbs used by Enhancv customers:** Achieved, Analyzed, Collaborated, Created, Designed, Developed, Enhanced, Established, Executed, Implemented, Improved, Led, Managed, Negotiated, Organized, Oversaw, Planned, Resolved, Spearheaded, Streamlined.
- **By job title (25 roles):** actuary, data scientist, dental hygienist, financial manager, genetic counselor, industrial psychologist, information security analyst, IT manager, lawyer, management analyst, marketing manager, mechanical engineer, healthcare operations manager, nurse anesthetist, nurse practitioner, occupational therapist, operations research analyst, orthotist/prosthetist, physician assistant, sales manager, software developer, speech pathologist, statistician, veterinarian, web developer.
- **By organisation or sector:** Google, Tesla, Fortune 500, Big 4, Harvard, University of California, construction, education, financial services, healthcare, IT, manufacturing, retail, transportation and logistics, utilities and energy.
- **By skill:** analytical thinking, partnership development, research, problem-solving, teamwork and communication, project and product management, results and achievements, tasks and responsibilities.

### Technical samples (most relevant to us)

| Role / sector | Sample verbs |
|---|---|
| Software developer | Architected, Automated, Built, Coded, Debugged, Deployed, Refactored, Scaled, Tested, Troubleshot |
| Web developer | Configured, Scripted, Programmed, Maintained, Launched |
| Information security analyst | Encrypted, Hardened, Penetrated, Remediated, Safeguarded, Mitigated |
| IT manager | Consolidated, Governed, Overhauled, Pioneered, Mobilized, Upgraded |
| Mechanical engineer | Fabricated, Prototyped, Simulated, Calibrated, Engineered, Troubleshot |
| Data scientist | Architected, Deciphered, Derived, Illustrated, Maximized |
| Statistician | Correlated, Extracted, Visualized, Forecasted |
| Google | Catalyzed, Scaled, Refined, Configured |
| Tesla | Prototyped, Fabricated, Manufactured, Calibrated, Revamped |

### Rules

- Match the job description's keywords, without lying.
- Be specific and quantify: percentages, time frames, volumes.
- Avoid overused verbs ("managed", "led", "worked on", "participated"). Note that Enhancv's own top-20 list contains "Led" and "Managed", so the advice is about variety, not a ban.
- Use active voice. Start bullets with a verb.
- **Match tense:** past tense for previous roles, present tense for the current one.
- Vary verbs across bullets.
- Pick verbs from the same semantic field. Synonyms such as "Directed" or "Orchestrated" strengthen leadership wording and help with ATS keyword matching.
- High-register (Latin or French origin) synonyms can add sophistication.
- Verbs like "Improved", "Optimized", "Enhanced" signal results.
- Adjectives may support a verb but not replace it.
- Show soft skills through actions, not as bare bullets.
- Use verbs across sections: summary (each sentence starting with a verb), experience, projects, skills, custom sections.
- The same verbs work in cover letters, letters of interest and interviews.

### Weak to stronger replacements

| Weak | Stronger alternatives |
|---|---|
| was responsible for | managed, directed, oversaw |
| worked on | developed, executed, designed |
| helped | assisted, facilitated, supported |
| led | chaired, guided, directed |
| used | utilized, applied, leveraged |
| participated in | contributed to, engaged in, joined |
| supported | bolstered, enhanced, strengthened |
| made | created, crafted, produced |
| handled | managed, administered, operated |
| put together | constructed, compiled, assembled |

### Before and after examples

- "A new training program was developed." becomes "Developed a new training program that boosted employee productivity by 20%."
- "Increased monthly blog visits." becomes "Magnified monthly blog visits from 100,000 to 2 million in a year."
- "Worked on a team project." becomes "Spearheaded a team project."
- "Worked on a project." becomes "Designed a prototype."
- "Led a team." becomes "Led a dynamic, high-performing team."

---

## 3. What both sources agree on

1. Start each bullet with an action verb, in active voice.
2. Do not repeat the same verb across bullets.
3. Replace weak phrases: "responsible for", "worked on", "helped".
4. Put a number or result next to the verb.
5. Mirror the job description's verbs, only where true.
6. Match the verb to the type of work.

Only Enhancv: tense rule, same-semantic-field synonyms for ATS, role and sector lists.
Only Resume.io: keep language natural, do not use words that feel forced.

---

## 4. How it can improve evaluation (CV score)

**Status: built.** `ActionVerbs.cs` and `ActionVerbData.cs` hold the bank. `WeakRolesCheck` uses the weak-opener table and flags passive openers. `RepetitionCheck` also counts near-synonym families and suggests unused verbs. `TenseCheck` is new. `led`, `managed` and `supported` are not weak openers, and the tense check flags only present tense under an ended role. `VerbVarietyCheck` was dropped because family repetition covers it. Items 5 to 7 below are not built.

Current state of the scoring checks in `CvScoring/`:

- `WeakRolesCheck` knows 9 weak openers. It checks words only.
- `RepetitionCheck` flags only the exact same first word used on more than 2 bullets.
- There is no tense check, no passive-voice check, no verb-by-role check and no job-description verb check.

Improvements:

1. **Bigger weak-phrase list.** Add "used", "made", "handled", "put together" and the other swaps from section 2. Be careful with "supported": Resume.io recommends "assisted" or "facilitated" for support roles, so judge it by role type.
2. **Passive voice.** Flag a bullet that opens with "was/were + past participle" (for example "was developed").
3. **Repetition by family.** Group verbs by category (Built, Developed, Created, Engineered as one family). Flag a family used too often, and report it the way Resume Worded does ("Automated (3 times)"). Also report verb variety: distinct opening verbs divided by bullets.
4. **Tense.** A role marked "Present" should use present-tense verbs, past roles past tense. Needs a list of irregular verbs (built, led, ran, wrote) to avoid false alarms. Only Enhancv gives this rule, so give it a low weight.
5. **Verb fit for the role.** In a technical CV, flag generic verbs ("worked", "managed") when a technical one is available (Architected, Deployed, Refactored).
6. **Job-description verbs.** Compare the verbs in the job posting with the CV's bullets. Feed the gaps to the Job match panel, for verbs the profile really supports.
7. **Replacement suggestions** (Resume Worded's "Show Suggestions"). For an overused verb, offer verbs from the same category that the CV does not use yet. Deterministic, no AI call.

Limits: all of this checks the form of a bullet, not whether it is true or good. A bullet can pass every verb check and still be vague. A verb dictionary of a few hundred words will not recognise every verb, so only penalise known-weak verbs and phrases. Never penalise an unknown first word.

---

## 5. How it can improve generation (`CvGenerationPrompt.cs`)

1. **Prompt rules.**
   - Start each bullet with a strong action verb.
   - Past tense for old roles, present tense for the current one.
   - Never open two bullets with the same verb across the whole CV.
   - Avoid the weak phrases and passive voice.
   - Never invent numbers.
   - Mirror job-description verbs only where the profile supports them.
2. **Small verb bank in the prompt, chosen by job title.** About 40 verbs for the target role family (for example technical), not 300. This directly reduces the "Automated / Built" repetition seen on the Resume Worded review of the CV. It is cheap in tokens.
3. **Check, then fix.** After generating, run `CvScorer`. If the repetition or weak-role checks fail, make one targeted refine call that names the exact bullets and the unused verbs it may use. Only spend the extra AI call when a check fails.

---

## 6. Cautions

- **Plain wording matters.** The sources push fancy synonyms ("utilized" for "used", "Magnified" for "Increased"). The prompt already asks for plain, ATS-friendly wording, and the writing-level setting exists to control this. The verb bank must not override it.
- **The sources contradict themselves.** Enhancv lists "Led" and "Managed" in its own top 20 while warning against them. Cap repetition per CV; do not ban verbs.
- **Do not copy their lists.** Write our own verb bank, grouped by category and tagged by role family (technical, management, support and so on).
- **Form is not truth.** The "use only facts from the profile" rule remains the real protection against invented achievements.

---

## 7. Suggested build order

1. Verb bank (own data file) plus the extended weak-phrase and passive checks.
2. Prompt rules plus the job-title verb bank in `CvGenerationPrompt.cs`.
3. Check-then-fix pass after generation.
4. Replacement suggestions in the score panel.
5. Tense check and job-description verb comparison last, since they have the most false alarms.

One shared verb bank would serve all three uses: scoring, the prompt and the suggestions.

---

## 8. Complete verb lists

Collected from the two pages with a browser-style fetch. Resume.io: 300 verbs in 15 categories (300 unique). Enhancv: 49 lists, 274 unique verbs. Together with a few of our own there are 414 unique verbs, stored in `ActionVerbData.cs` (`backend.jobhunter/src/Application/CvDrafts/CvScoring/`). Lists are as published; check a verb against the page before relying on it.

### 8.1 Resume.io (15 categories)

- **Leadership** (20): Appointed, Approved, Chaired, Coached, Directed, Enforced, Enlightened, Headed, Instructed, Merged, Nurtured, Orchestrated, Oversaw, Predicted, Presided, Recommended, Sculpted, Shaped, Spearheaded, Strengthened
- **Achievement** (20): Accelerated, Accomplished, Attained, Boosted, Combined, Developed, Founded, Furthered, Generated, Hit, Lifted, Maximized, Measured, Outperformed, Produced, Raised, Showcased, Stimulated, Sustained, Targeted
- **Teamwork** (20): Arranged, Contributed, Embraced, Encouraged, Energized, Established, Explored, Forged, Fostered, Intervened, Joined, Moderated, Organized, Participated, Partnered, Planned, Reorganized, Taught, United, Volunteered
- **Communication** (20): Advertised, Articulated, Briefed, Clarified, Conveyed, Corresponded, Debated, Defined, Documented, Elicited, Explained, Expressed, Interpreted, Lectured, Lobbied, Mediated, Outlined, Persuaded, Reinforced, Transmitted
- **Project management** (20): Automated, Brainstormed, Charted, Consolidated, Contracted, Controlled, Deployed, Discovered, Engineered, Envisioned, Evaluated, Executed, Forecasted, Governed, Integrated, Overhauled, Patched, Performed, Plotted, Projected
- **People management** (20): Appraised, Assigned, Delegated, Educated, Empowered, Enabled, Facilitated, Groomed, Guided, Hired, Influenced, Instilled, Mentored, Motivated, Promoted, Sponsored, Supervised, Tracked, Trained, Unified
- **Customer service** (20): Advised, Advocated, Assisted, Attracted, Concluded, Consulted, Cooperated, Counseled, Delivered, Handled, Hosted, Incorporated, Informed, Interacted, Negotiated, Resolved, Settled, Supported, Updated, Verified
- **Problem-solving** (20): Addressed, Allocated, Arbitrated, Catalogued, Centralized, Collected, Compared, Debugged, Deciphered, Derived, Detected, Estimated, Experimented, Fulfilled, Identified, Interceded, Logged, Rectified, Synthesized, Troubleshot
- **Improved** (20): Acquired, Adapted, Advanced, Amplified, Augmented, Championed, Constructed, Critiqued, Differentiated, Enhanced, Exceeded, Expanded, Focused, Ignited, Launched, Optimized, Rebuilt, Reconciled, Restructured, Transformed
- **Researched** (20): Analyzed, Captured, Checked, Classified, Compiled, Conducted, Considered, Diagnosed, Discerned, Examined, Inspected, Quantified, Reviewed, Screened, Scrutinized, Steered, Surveyed, Traced, Uncovered, Undertook
- **Organization** (20): Administered, Aligned, Authorized, Customized, Effected, Ensured, Filed, Fixed, Formulated, Gathered, Implemented, Itemized, Maintained, Mapped, Modified, Networked, Oriented, Regulated, Remodelled, Upgraded
- **Creativity** (20): Architected, Authored, Composed, Conceived, Conceptualized, Crafted, Created, Designed, Drafted, Fabricated, Fashioned, Illustrated, Imagined, Inspired, Invented, Piloted, Probed, Sparked, Storyboarded, Visualized
- **Worked on** (20): Acted, Adjusted, Assembled, Assessed, Audited, Calculated, Collaborated, Coordinated, Curated, Devised, Initiated, Investigated, Made, Mobilized, Monitored, Operated, Perfected, Processed, Pursued, Refined
- **Increased** (20): Bolstered, Built, Capitalized, Computed, Cultivated, Doubled, Drove, Enlivened, Escalated, Expedited, Fortified, Gained, Intensified, Multiplied, Outpaced, Revamped, Revised, Revitalized, Surpassed, Yielded
- **Reduced** (20): Condensed, Conserved, Corrected, Curtailed, Decreased, Deducted, Diminished, Dispensed, Eliminated, Extracted, Lessened, Lowered, Minimized, Saved, Shattered, Shrunk, Slashed, Streamlined, Terminated, Trimmed

### 8.2 Enhancv lists

**Top 20**

- **Top 20 action words used by enhancv customers** (20): Achieved, Analyzed, Collaborated, Created, Designed, Developed, Enhanced, Established, Executed, Implemented, Improved, Led, Managed, Negotiated, Organized, Oversaw, Planned, Resolved, Spearheaded, Streamlined

**Job title**

- **Actuary resume action verbs** (19): Analyzed, Assessed, Calculated, Designed, Developed, Evaluated, Forecasted, Implemented, Modeled, Monitored, Optimized, Predicted, Quantified, Recommended, Researched, Reviewed, Risk-assessed, Simulated, Synthesized
- **Data scientist resume action verbs** (15): Appraised, Architected, Constructed, Deciphered, Derived, Executed, Forecasted, Illustrated, Innovated, Integrated, Maximized, Orchestrated, Partnered, Scrutinized, Streamlined
- **Dental hygienist resume action verbs** (15): Administered, Assessed, Charted, Educated, Examined, Maintained, Performed, Polished, Recorded, Sterilized, Treated, Updated, Utilized, Verified, X-rayed
- **Financial manager resume action verbs** (18): Allocated, Appraised, Audited, Budgeted, Consolidated, Diversified, Enhanced, Forecasted, Formulated, Maximized, Negotiated, Orchestrated, Reconciled, Secured, Streamlined, Strategized, Supervised, Synthesized
- **Genetic counselor resume action verbs** (17): Assessed, Conveyed, Coordinated, Diagnosed, Educated, Evaluated, Facilitated, Interpreted, Investigated, Liaised, Recommended, Screened, Summarized, Supported, Synthesized, Verified, Analyzed
- **Industrial psychologist resume action verbs** (18): Assessed, Calibrated, Conducted, Diagnosed, Enhanced, Evaluated, Facilitated, Formulated, Implemented, Mediated, Optimized, Orchestrated, Researched, Strategized, Streamlined, Synthesized, Trained, Validated
- **Information security analyst action verbs** (18): Administered, Configured, Detected, Encrypted, Implemented, Investigated, Mitigated, Monitored, Penetrated, Protected, Remediated, Secured, Tested, Validated, Hardened, Audited, Safeguarded, Analyzed
- **IT manager resume action verbs** (20): Architected, Automated, Championed, Consolidated, Deployed, Diagnosed, Enhanced, Engineered, Facilitated, Governed, Integrated, Leveraged, Mobilized, Orchestrated, Overhauled, Pioneered, Spearheaded, Streamlined, Transformed, Upgraded
- **Lawyer resume action verbs** (20): Advocated, Arbitrated, Briefed, Counseled, Drafted, Enforced, Facilitated, Interpreted, Litigated, Mediated, Negotiated, Prosecuted, Represented, Resolved, Strategized, Subpoenaed, Synthesized, Testified, Validated, Vindicated
- **Management analyst resume action verbs** (20): Analyzed, Assessed, Audited, Benchmarking, Collaborated, Consulted, Diagnosed, Evaluated, Facilitated, Formulated, Implemented, Investigated, Monitored, Optimized, Recommended, Researched, Reviewed, Streamlined, Synthesized, Validated
- **Marketing manager resume action verbs** (20): Analyzed, Boosted, Championed, Conceptualized, Coordinated, Designed, Directed, Enhanced, Formulated, Generated, Implemented, Innovated, Launched, Managed, Orchestrated, Promoted, Spearheaded, Strategized, Supervised, Targeted
- **Mechanical engineer resume action verbs** (19): Assembled, Calibrated, Computed, Conceptualized, Designed, Diagnosed, Engineered, Fabricated, Innovated, Integrated, Modeled, Optimized, Prototyped, Simulated, Streamlined, Synthesized, Tested, Troubleshot, Validated
- **Healthcare operations manager resume action verbs** (20): Administered, Aligned, Coordinated, Directed, Enhanced, Facilitated, Implemented, Improved, Integrated, Managed, Monitored, Optimized, Orchestrated, Oversaw, Planned, Prioritized, Streamlined, Supervised, Synthesized, Transformed
- **Nurse anesthetist resume action verbs** (18): Administered, Assessed, Calibrated, Coordinated, Delivered, Educated, Evaluated, Implemented, Monitored, Prepared, Recorded, Responded, Safeguarded, Scheduled, Stabilized, Supervised, Treated, Verified
- **Nurse practitioner resume action verbs** (20): Administered, Advocated, Assessed, Calibrated, Coordinated, Counseled, Diagnosed, Educated, Facilitated, Implemented, Monitored, Optimized, Prescribed, Prioritized, Rehabilitated, Resuscitated, Stabilized, Synthesized, Triaged, Verified
- **Occupational therapist resume action verbs** (20): Adapted, Assessed, Collaborated, Customized, Developed, Educated, Enabled, Enhanced, Evaluated, Facilitated, Guided, Implemented, Innovated, Maximized, Motivated, Planned, Rehabilitated, Tailored, Trained, Transformed
- **Operations research analyst resume action verbs** (19): Analyzed, Assessed, Calculated, Developed, Evaluated, Examined, Formulated, Implemented, Investigated, Modeled, Optimized, Predicted, Quantified, Researched, Simulated, Solved, Strategized, Synthesized, Validated
- **Orthotist and prosthetist resume action verbs** (20): Assessed, Calibrated, Casted, Customized, Designed, Developed, Diagnosed, Fabricated, Fitted, Implemented, Innovated, Manufactured, Measured, Modified, Prescribed, Rehabilitated, Researched, Restored, Sculpted, Synthesized
- **Physician assistant resume action verbs** (20): Administered, Analyzed, Assisted, Collaborated, Conducted, Diagnosed, Educated, Evaluated, Examined, Implemented, Interpreted, Monitored, Managed, Prescribed, Recommended, Researched, Reviewed, Supervised, Treated, Verified
- **Sales manager resume action verbs** (20): Accelerated, Achieved, Analyzed, Championed, Closed, Coordinated, Cultivated, Devised, Directed, Drove, Engineered, Expanded, Generated, Implemented, Leveraged, Motivated, Negotiated, Orchestrated, Penetrated, Strategized
- **Software developer resume action verbs** (20): Architected, Automated, Built, Coded, Debugged, Deployed, Designed, Developed, Engineered, Enhanced, Implemented, Integrated, Optimized, Programmed, Refactored, Scaled, Tested, Troubleshot, Updated, Validated
- **Speech pathologist resume action verbs** (20): Assessed, Coached, Communicated, Counseled, Diagnosed, Educated, Evaluated, Facilitated, Formulated, Implemented, Individualized, Interpreted, Instructed, Monitored, Planned, Remediated, Screened, Tailored, Treated, Trained
- **Statistician resume action verbs** (20): Analyzed, Calculated, Compiled, Correlated, Designed, Evaluated, Examined, Extracted, Formulated, Interpreted, Modeled, Optimized, Predicted, Quantified, Simulated, Synthesized, Tested, Validated, Visualized, Forecasted
- **Veterinarian resume action verbs** (20): Administered, Analyzed, Assessed, Diagnosed, Examined, Managed, Monitored, Operated, Prescribed, Prevented, Rehabilitated, Researched, Screened, Sterilized, Supervised, Sutured, Treated, Vaccinated, Consulted, Educated
- **Web developer resume action verbs** (20): Analyzed, Built, Coded, Configured, Created, Debugged, Designed, Developed, Deployed, Enhanced, Implemented, Integrated, Launched, Maintained, Optimized, Programmed, Scripted, Tested, Updated, Validated

**Organisation or sector**

- **Google resume action verbs** (29): Accelerated, Architected, Automated, Catalyzed, Championed, Conceptualized, Configured, Debugged, Deployed, Designed, Developed, Engineered, Enhanced, Implemented, Innovated, Integrated, Leveraged, Optimized, Orchestrated, Pioneered, Programmed, Refined, Scaled, Streamlined, Spearheaded, Synthesized, Transformed, Upgraded, Validated
- **Tesla resume action verbs** (30): Accelerated, Advanced, Architected, Automated, Calibrated, Conceptualized, Configured, Constructed, Debugged, Deployed, Designed, Developed, Engineered, Enhanced, Executed, Fabricated, Implemented, Innovated, Integrated, Leveraged, Manufactured, Optimized, Orchestrated, Prototyped, Refined, Resolved, Revamped, Spearheaded, Streamlined, Transformed
- **Fortune 500 resume action verbs** (28): Accelerated, Achieved, Administered, Amplified, Architected, Championed, Conceptualized, Cultivated, Deployed, Designed, Directed, Engineered, Enhanced, Executed, Facilitated, Implemented, Innovated, Integrated, Maximized, Optimized, Orchestrated, Pioneered, Spearheaded, Streamlined, Strategized, Supervised, Transformed, Unified
- **Big 4 resume power verbs** (28): Advised, Analyzed, Assessed, Audited, Compiled, Consulted, Coordinated, Designed, Developed, Evaluated, Examined, Facilitated, Implemented, Improved, Investigated, Managed, Optimized, Orchestrated, Partnered, Planned, Prepared, Presented, Resolved, Reviewed, Strategized, Synthesized, Trained, Verified
- **Harvard resume action verbs** (26): Advocated, Analyzed, Arbitrated, Authored, Briefed, Consulted, Championed, Counseled, Designed, Directed, Drafted, Engineered, Evaluated, Implemented, Innovated, Interpreted, Litigated, Mediated, Negotiated, Optimized, Orchestrated, Presented, Researched, Resolved, Strategized, Synthesized
- **Action verb list for the University of California** (30): Analyzed, Authored, Advocated, Chaired, Collaborated, Conducted, Coordinated, Designed, Developed, Directed, Evaluated, Experimented, Facilitated, Formulated, Implemented, Investigated, Led, Managed, Mentored, Optimized, Orchestrated, Organized, Oversaw, Planned, Promoted, Published, Researched, Strategized, Supervised, Synthesized
- **Strong action verbs for construction resumes** (24): Administered, Assembled, Blueprinted, Calculated, Constructed, Devised, Drafted, Engineered, Erected, Estimated, Executed, Fabricated, Formulated, Implemented, Inspected, Orchestrated, Oversaw, Planned, Rehabilitated, Renovated, Spearheaded, Supervised, Surveyed, Upgraded
- **Resume action verbs for the education sector** (24): Advised, Advocated, Assessed, Authored, Chaired, Cultivated, Devised, Differentiated, Educated, Empowered, Enlightened, Evaluated, Facilitated, Fostered, Guided, Implemented, Instructed, Mentored, Moderated, Nurtured, Orchestrated, Planned, Revamped, Tailored
- **Action verbs to describe financial services** (24): Allocated, Appraised, Audited, Budgeted, Calculated, Consolidated, Devised, Diversified, Endorsed, Evaluated, Forecasted, Formulated, Hedged, Implemented, Invested, Monitored, Optimized, Orchestrated, Reconciled, Strategized, Structured, Synthesized, Valued, Verified
- **Healthcare action verbs for a resume** (24): Administered, Analyzed, Assessed, Calibrated, Diagnosed, Documented, Educated, Evaluated, Facilitated, Implemented, Innovated, Interpreted, Monitored, Optimized, Operated, Prescribed, Rehabilitated, Researched, Revitalized, Screened, Specialized, Stabilized, Synthesized, Treated
- **Information technology action verbs** (23): Architected, Automated, Configured, Debugged, Deployed, Engineered, Enhanced, Executed, Implemented, Innovated, Integrated, Leveraged, Maintained, Optimized, Orchestrated, Programmed, Refined, Resolved, Secured, Simulated, Streamlined, Synthesized, Upgraded
- **The best action verbs for the manufacturing industry** (24): Assembled, Calibrated, Constructed, Crafted, Designed, Engineered, Fabricated, Formulated, Implemented, Inspected, Manufactured, Optimized, Orchestrated, Overhauled, Processed, Produced, Refined, Regulated, Standardized, Streamlined, Supervised, Tested, Validated, Welded
- **Retail sector power verbs** (24): Administered, Advertised, Analyzed, Appraised, Budgeted, Cataloged, Coordinated, Devised, Displayed, Endorsed, Forecasted, Implemented, Innovated, Merchandised, Optimized, Orchestrated, Oversaw, Promoted, Reconciled, Strategized, Streamlined, Supervised, Trained, Visualized
- **Transportation and logistics action verbs** (25): Allocated, Analyzed, Coordinated, Devised, Dispatched, Drove, Engineered, Facilitated, Implemented, Improved, Innovated, Integrated, Managed, Monitored, Optimized, Orchestrated, Overhauled, Planned, Procured, Routed, Scheduled, Shipped, Streamlined, Supervised, Tracked
- **Utilities and energy action verbs** (23): Analyzed, Calibrated, Configured, Constructed, Devised, Engineered, Enhanced, Generated, Implemented, Inspected, Installed, Integrated, Maintained, Monitored, Optimized, Operated, Orchestrated, Overhauled, Regulated, Repaired, Spearheaded, Streamlined, Upgraded

**Skill**

- **Action words to emphasize analytical thinking** (25): Assessed, Audited, Calculated, Compared, Computed, Critiqued, Diagnosed, Dissected, Evaluated, Examined, Forecasted, Identified, Interpreted, Investigated, Measured, Modeled, Quantified, Researched, Scrutinized, Studied, Synthesized, Tested, Validated, Projected, Appraised
- **Action verbs for partner acquisition and partnership development** (30): Analyzed, Authored, Advocated, Chaired, Collaborated, Conducted, Coordinated, Designed, Developed, Directed, Evaluated, Experimented, Facilitated, Formulated, Implemented, Investigated, Led, Managed, Mentored, Optimized, Orchestrated, Organized, Oversaw, Planned, Promoted, Published, Researched, Strategized, Supervised, Synthesized
- **Best resume power words for research skills** (21): Abstracted, Accumulated, Aggregated, Calculated, Cataloged, Classified, Compiled, Correlated, Deciphered, Derived, Detected, Dissected, Evaluated, Examined, Extrapolated, Interpreted, Investigated, Quantified, Reported, Scrutinized, Synthesized
- **Resume action words for problem-solving** (24): Addressed, Analyzed, Anticipated, Calculated, Conceived, Devised, Diagnosed, Engineered, Formulated, Identified, Improvised, Innovated, Investigated, Navigated, Overcame, Proposed, Rectified, Redesigned, Resolved, Solved, Strategized, Synthesized, Troubleshot, Uncovered
- **Resume action verbs for teamwork and communication** (25): Advised, Aligned, Arbitrated, Articulated, Collaborated, Communicated, Consulted, Conveyed, Coordinated, Counseled, Facilitated, Guided, Integrated, Liaised, Mediated, Mentored, Moderated, Negotiated, Partnered, Presented, Reconciled, Unified, Influenced, Persuaded, Summarized
- **Power verbs for project and product management skills** (21): Administered, Allocated, Championed, Coordinated, Designed, Directed, Engineered, Facilitated, Implemented, Innovated, Launched, Managed, Monitored, Orchestrated, Oversaw, Planned, Prioritized, Produced, Scheduled, Strategized, Supervised
- **Resume power words to use when describing results and achievements** (24): Accelerated, Achieved, Amplified, Boosted, Capitalized, Completed, Delivered, Doubled, Elevated, Enhanced, Exceeded, Expanded, Generated, Improved, Maximized, Multiplied, Optimized, Outperformed, Reduced, Resolved, Surpassed, Transformed, Upgraded, Yielded
- **Resume action verbs to describe tasks and responsibilities** (20): Administered, Allocated, Approved, Assigned, Chaired, Coordinated, Delegated, Directed, Enforced, Ensured, Executed, Governed, Handled, Implemented, Managed, Monitored, Oversaw, Regulated, Reviewed, Supervised

### 8.3 Weak openers named by Enhancv and their suggested replacements

| Weak | Replacements |
|---|---|
| was responsible for | managed, directed, oversaw |
| worked on | developed, executed, designed |
| helped | assisted, facilitated, supported |
| led | chaired, guided, directed |
| used | utilized, applied, leveraged |
| participated in | contributed to, engaged in, joined |
| supported | bolstered, enhanced, strengthened |
| made | created, crafted, produced |
| handled | managed, administered, operated |
| put together | constructed, compiled, assembled |

### 8.4 Added by us (not from the sources)

Migrated, Containerized, Instrumented, Provisioned, Modernized, Benchmarked, Decommissioned
