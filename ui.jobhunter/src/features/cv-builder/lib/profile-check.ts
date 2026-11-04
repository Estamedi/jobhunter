export interface ProfileGap {
  id:
    | 'skills'
    | 'email'
    | 'phone'
    | 'location'
    | 'photo'
    | 'headline'
    | 'about'
    | 'experience'
    | 'education'
  message: string
}

// What is missing from a profile before a CV is written from it. Every gap is fixed on the profile page.
// The CV form asks only for what a CV header and skills need. The profile page also passes photo, headline,
// about, experience and education to get its fuller checklist; a piece that is not passed is not checked.
export function profileGaps(input: {
  skills: number
  email?: string | null
  phone?: string | null
  location?: string | null
  hasPhoto?: boolean
  headline?: string | null
  about?: string | null
  experiences?: number
  educations?: number
}): ProfileGap[] {
  const gaps: ProfileGap[] = []
  if (input.hasPhoto === false) {
    gaps.push({ id: 'photo', message: 'You have not added a photo yet.' })
  }
  if (input.headline !== undefined && !input.headline?.trim()) {
    gaps.push({ id: 'headline', message: 'Your headline is empty.' })
  }
  if (input.about !== undefined && !input.about?.trim()) {
    gaps.push({ id: 'about', message: 'Your About section is empty.' })
  }
  if (input.experiences === 0) {
    gaps.push({ id: 'experience', message: 'No experience added yet.' })
  }
  if (input.educations === 0) {
    gaps.push({ id: 'education', message: 'No education added yet.' })
  }
  if (input.skills === 0) {
    gaps.push({ id: 'skills', message: 'Your profile has no skills yet.' })
  }
  if (!input.email?.trim()) {
    gaps.push({
      id: 'email',
      message: 'Your email is missing, so the CV header will have none.',
    })
  }
  if (!input.phone?.trim()) {
    gaps.push({
      id: 'phone',
      message: 'Your phone number is missing from the CV header.',
    })
  }
  if (!input.location?.trim()) {
    gaps.push({
      id: 'location',
      message: 'Your location is missing from the CV header.',
    })
  }
  return gaps
}
