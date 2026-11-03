export interface ProfileGap {
  id: 'skills' | 'email' | 'phone' | 'location'
  message: string
}

// What is missing from a profile before a CV is written from it. Experience has its own message in the
// form, so it is not listed here. Every gap is fixed on the profile page.
export function profileGaps(input: {
  skills: number
  email?: string | null
  phone?: string | null
  location?: string | null
}): ProfileGap[] {
  const gaps: ProfileGap[] = []
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
