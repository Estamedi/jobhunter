import { type ProfileEducation, type ProfileExperience } from '../api'

// The role to show under the name: the current one (the latest started, if there are several), otherwise
// the most recent one.
export function currentRole(
  experiences: ProfileExperience[]
): { title: string; company: string } | null {
  if (experiences.length === 0) return null
  const latest = (list: ProfileExperience[]) =>
    [...list].sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
  const current = experiences.filter((e) => e.isCurrent || !e.endDate)
  const role = latest(current.length > 0 ? current : experiences)
  return { title: role.title, company: role.company }
}

// The school to show under the name: one still in progress, otherwise the one that ended last.
export function latestSchool(educations: ProfileEducation[]): string | null {
  if (educations.length === 0) return null
  const key = (e: ProfileEducation) => e.endDate ?? '9999-12-31'
  const school = [...educations].sort((a, b) => key(b).localeCompare(key(a)))[0]
  return school.institution
}

export const CLAMP_CHARS = 240
const CLAMP_LINES = 3

// Long text is cut short with a "see more" toggle, like a LinkedIn About section.
export function needsClamp(text: string): boolean {
  return text.length > CLAMP_CHARS || text.split('\n').length > CLAMP_LINES
}

// Initials for the avatar when there is no photo.
export function initialsOf(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return (first + last).toUpperCase()
}
