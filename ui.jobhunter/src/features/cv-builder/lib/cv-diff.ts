import { type CvContent } from '../api'

export interface CvChange {
  // Section heading, or "Experience · Role at Company" for one entry.
  label: string
  // One short sentence, e.g. "3 added, 1 removed".
  summary: string
  added: string[]
  removed: string[]
}

// Bold markers and case do not make a different item.
const clean = (s?: string | null) => (s ?? '').replace(/\*\*/g, '').trim()
const norm = (s?: string | null) => clean(s).toLowerCase()

function setDiff(before: string[], after: string[]) {
  const b = new Set(before.map(norm))
  const a = new Set(after.map(norm))
  return {
    added: after.filter((x) => !b.has(norm(x))).map(clean),
    removed: before.filter((x) => !a.has(norm(x))).map(clean),
    reordered:
      before.map(norm).join('\n') !== after.map(norm).join('\n') &&
      before.every((x) => a.has(norm(x))) &&
      after.every((x) => b.has(norm(x))),
  }
}

function countSummary(added: number, removed: number, reordered = false) {
  const parts = [
    added > 0 && `${added} added`,
    removed > 0 && `${removed} removed`,
    reordered && 'reordered',
  ].filter(Boolean)
  return parts.join(', ')
}

function listChange(
  label: string,
  before: string[],
  after: string[]
): CvChange | null {
  const { added, removed, reordered } = setDiff(before, after)
  if (!added.length && !removed.length && !reordered) return null
  return {
    label,
    summary: countSummary(added.length, removed.length, reordered),
    added,
    removed,
  }
}

function textChange(
  label: string,
  before?: string | null,
  after?: string | null
): CvChange | null {
  if (norm(before) === norm(after)) return null
  return {
    label,
    summary: !clean(before) ? 'added' : !clean(after) ? 'removed' : 'rewritten',
    added: clean(after) ? [clean(after)] : [],
    removed: clean(before) ? [clean(before)] : [],
  }
}

// What changed going from `before` to `after`, section by section, for the version history.
export function diffCv(before: CvContent, after: CvContent): CvChange[] {
  const changes: (CvChange | null)[] = []

  changes.push(textChange('Headline', before.headline, after.headline))
  changes.push(textChange('Summary', before.summary, after.summary))

  const skillItems = (c: CvContent) =>
    c.skills.flatMap((g) => g.items.map((i) => clean(i)))
  changes.push(listChange('Skills', skillItems(before), skillItems(after)))

  changes.push(
    listChange(
      'Projects',
      before.projects.map(
        (p) => `${p.name}${p.description ? ` – ${p.description}` : ''}`
      ),
      after.projects.map(
        (p) => `${p.name}${p.description ? ` – ${p.description}` : ''}`
      )
    )
  )

  const expKey = (e: CvContent['experience'][number]) =>
    e.sourceId != null
      ? `id:${e.sourceId}`
      : `${norm(e.role)}|${norm(e.company)}`
  const beforeExp = new Map(before.experience.map((e) => [expKey(e), e]))
  const afterExp = new Map(after.experience.map((e) => [expKey(e), e]))
  for (const [key, a] of afterExp) {
    const label = `Experience · ${a.role} at ${a.company}`
    const b = beforeExp.get(key)
    if (!b) {
      changes.push({
        label,
        summary: 'entry added',
        added: a.bullets.map(clean),
        removed: [],
      })
      continue
    }
    changes.push(listChange(label, b.bullets, a.bullets))
  }
  for (const [key, b] of beforeExp) {
    if (!afterExp.has(key)) {
      changes.push({
        label: `Experience · ${b.role} at ${b.company}`,
        summary: 'entry removed',
        added: [],
        removed: b.bullets.map(clean),
      })
    }
  }

  const eduLabel = (e: CvContent['education'][number]) =>
    `${e.degree}, ${e.institution}${e.details ? ` – ${e.details}` : ''}`
  changes.push(
    listChange(
      'Education',
      before.education.map(eduLabel),
      after.education.map(eduLabel)
    )
  )

  changes.push(
    listChange('Certifications', before.certifications, after.certifications)
  )
  changes.push(listChange('Languages', before.languages, after.languages))
  changes.push(listChange('Links', before.links, after.links))

  return changes.filter((c): c is CvChange => c !== null)
}

// "Skills: 3 added · Summary: rewritten", or a note that nothing differs.
export function summarizeChanges(changes: CvChange[]) {
  if (changes.length === 0) return 'No visible difference in the CV content.'
  return changes
    .map((c) => `${c.label.split(' · ')[0]}: ${c.summary}`)
    .filter((v, i, all) => all.indexOf(v) === i)
    .join(' · ')
}
