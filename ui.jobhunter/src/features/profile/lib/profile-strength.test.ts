import { describe, expect, it } from 'vitest'
import { profileGaps } from '@/features/cv-builder/lib/profile-check'
import { profileStrength } from './profile-strength'

const complete = {
  skills: 4,
  email: 'a@b.test',
  phone: '+1',
  location: 'Muscat',
  hasPhoto: true,
  headline: 'Engineer',
  about: 'Hello',
  experiences: 2,
  educations: 1,
}

describe('profileStrength', () => {
  it('is 100% when nothing is missing', () => {
    expect(profileStrength(profileGaps(complete))).toEqual({
      done: 9,
      total: 9,
      percent: 100,
    })
  })

  it('counts each missing piece', () => {
    const gaps = profileGaps({
      ...complete,
      hasPhoto: false,
      about: '',
      phone: null,
    })

    expect(gaps.map((g) => g.id)).toEqual(['photo', 'about', 'phone'])
    expect(profileStrength(gaps)).toEqual({ done: 6, total: 9, percent: 67 })
  })

  it('is 0% for an empty profile, and never below it', () => {
    const gaps = profileGaps({
      skills: 0,
      email: '',
      phone: '',
      location: '',
      hasPhoto: false,
      headline: '',
      about: '',
      experiences: 0,
      educations: 0,
    })

    expect(profileStrength(gaps)).toEqual({ done: 0, total: 9, percent: 0 })
  })
})
