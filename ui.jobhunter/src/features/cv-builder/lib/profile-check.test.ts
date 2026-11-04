import { describe, expect, it } from 'vitest'
import { profileGaps } from './profile-check'

describe('profileGaps', () => {
  it('finds nothing missing on a complete profile', () => {
    expect(
      profileGaps({
        skills: 5,
        email: 'a@b.test',
        phone: '+1',
        location: 'Muscat',
      })
    ).toEqual([])
  })

  it('lists every missing piece, in a fixed order', () => {
    expect(
      profileGaps({ skills: 0, email: null, phone: '', location: '  ' }).map(
        (g) => g.id
      )
    ).toEqual(['skills', 'email', 'phone', 'location'])
  })

  it('lists only what is missing', () => {
    expect(
      profileGaps({
        skills: 3,
        email: 'a@b.test',
        phone: null,
        location: 'Muscat',
      }).map((g) => g.id)
    ).toEqual(['phone'])
  })

  it('checks the extra pieces only when they are passed in', () => {
    const base = {
      skills: 3,
      email: 'a@b.test',
      phone: '+1',
      location: 'Muscat',
    }

    expect(profileGaps(base)).toEqual([])
    expect(
      profileGaps({
        ...base,
        hasPhoto: false,
        headline: ' ',
        about: null,
        experiences: 0,
        educations: 0,
      }).map((g) => g.id)
    ).toEqual(['photo', 'headline', 'about', 'experience', 'education'])
    expect(
      profileGaps({
        ...base,
        hasPhoto: true,
        headline: 'Engineer',
        about: 'Hello',
        experiences: 2,
        educations: 1,
      })
    ).toEqual([])
  })
})
