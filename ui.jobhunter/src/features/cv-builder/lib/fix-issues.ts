import { type CvScoreCheck, type CvScoreLocation, type CvSection } from '../api'

// One score issue to fix, with the check it came from.
export interface FixIssue {
  checkId: string
  message: string
  locations: CvScoreLocation[]
}

// Checks the AI can fix by rewriting text. Dates come from the profile and the skills count depends on
// what the candidate really has, so rewriting cannot help there.
const FIXABLE_CHECKS = new Set([
  'ai-patterns',
  'buzzwords',
  'style-rules',
  'weak-roles',
  'repetition',
  'readability',
  'tense',
  'quantify',
])

const SECTIONS = new Set<string>([
  'headline',
  'summary',
  'skills',
  'projects',
  'experience',
  'education',
  'certifications',
  'languages',
  'links',
])

export const isFixable = (checkId: string) => FIXABLE_CHECKS.has(checkId)

export function collectFixable(checks: CvScoreCheck[]): FixIssue[] {
  return checks
    .filter((c) => isFixable(c.id))
    .flatMap((c) =>
      c.issues.map((i) => ({
        checkId: c.id,
        message: i.message,
        locations: i.locations,
      }))
    )
}

// The CV section an issue should be fixed in; null when it points at none.
const sectionOf = (issue: FixIssue): CvSection | null => {
  const section = issue.locations[0]?.section
  return section && SECTIONS.has(section) ? (section as CvSection) : null
}

// Issues grouped by the section they are in, so each section is rewritten once.
export function groupBySection(issues: FixIssue[]) {
  const groups = new Map<CvSection, FixIssue[]>()
  for (const issue of issues) {
    const section = sectionOf(issue)
    if (!section) continue
    groups.set(section, [...(groups.get(section) ?? []), issue])
  }
  return groups
}

const MAX_LENGTH = 3800

// The instruction sent to "refine section": fix exactly these problems and nothing else.
export function buildFixInstruction(issues: FixIssue[]) {
  let text =
    'Fix only the writing problems listed below. Change as little as possible. Keep every fact, number, tool, ' +
    'date and job title exactly as it is, never invent anything, and copy every line that is not listed unchanged. ' +
    'If a problem would need a fact that is not in the background (for example a missing number), leave that line as it is.\n'

  issues.forEach((issue, n) => {
    const lines = issue.locations
      .slice(0, 5)
      .map((l) => `   Line: "${l.text.slice(0, 300)}"`)
      .join('\n')
    const block = `\n${n + 1}. ${issue.message}\n${lines}`
    if (text.length + block.length <= MAX_LENGTH) text += block
  })
  return text
}
