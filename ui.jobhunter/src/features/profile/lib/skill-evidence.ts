// How the candidate knows a skill. Matches the backend SkillEvidenceLevel; no level means "not set".
export const SKILL_EVIDENCE_LEVELS = [
  { value: 'Worked', label: 'Used at work', hint: 'Used in a real job' },
  {
    value: 'Project',
    label: 'Project',
    hint: 'Used in a personal or school project',
  },
  { value: 'Course', label: 'Course', hint: 'Studied in a course' },
  { value: 'Learning', label: 'Learning', hint: 'Currently learning it' },
  { value: 'Claimed', label: 'I know it', hint: 'Listed as a normal skill' },
] as const

export const MAX_SKILL_NOTE_LENGTH = 300

// The short label shown next to a skill. Nothing for a skill with no level, so existing skills look as before.
export function skillLevelLabel(level?: string | null): string | null {
  if (!level) return null
  return SKILL_EVIDENCE_LEVELS.find((l) => l.value === level)?.label ?? null
}
