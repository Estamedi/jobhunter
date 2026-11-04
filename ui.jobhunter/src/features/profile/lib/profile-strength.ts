import { type ProfileGap } from '@/features/cv-builder/lib/profile-check'

// How many things the checklist asks for: photo, headline, about, experience, education, skills, email,
// phone and location. The bar shows how many of them are done.
const PROFILE_CHECKS = 9

export function profileStrength(gaps: ProfileGap[]) {
  const done = Math.min(
    PROFILE_CHECKS,
    Math.max(0, PROFILE_CHECKS - gaps.length)
  )
  return {
    done,
    total: PROFILE_CHECKS,
    percent: Math.round((done / PROFILE_CHECKS) * 100),
  }
}
