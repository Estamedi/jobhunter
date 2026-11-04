import { describe, expect, it } from 'vitest'
import { type ProfileEducation, type ProfileExperience } from '../api'
import {
  CLAMP_CHARS,
  currentRole,
  initialsOf,
  latestSchool,
  needsClamp,
} from './profile-summary'

const role = (over: Partial<ProfileExperience>): ProfileExperience => ({
  id: 1,
  title: 'Dev',
  company: 'Acme',
  isCurrent: false,
  startDate: '2020-01-01',
  endDate: '2021-01-01',
  skills: [],
  ...over,
})

const school = (over: Partial<ProfileEducation>): ProfileEducation => ({
  id: 1,
  institution: 'Uni',
  degree: 'BSc',
  ...over,
})

describe('currentRole', () => {
  it('has no role without experience', () => {
    expect(currentRole([])).toBeNull()
  })

  it('prefers a current role, and the latest started among several', () => {
    const roles = [
      role({ id: 1, title: 'Old', company: 'A', startDate: '2015-01-01' }),
      role({
        id: 2,
        title: 'Lead',
        company: 'B',
        isCurrent: true,
        endDate: null,
        startDate: '2026-01-01',
      }),
      role({
        id: 3,
        title: 'Dev',
        company: 'B',
        isCurrent: true,
        endDate: null,
        startDate: '2025-01-01',
      }),
    ]

    expect(currentRole(roles)).toEqual({ title: 'Lead', company: 'B' })
  })

  it('falls back to the most recent role when none is current', () => {
    const roles = [
      role({ title: 'First', company: 'A', startDate: '2015-01-01' }),
      role({ id: 2, title: 'Second', company: 'B', startDate: '2018-01-01' }),
    ]

    expect(currentRole(roles)).toEqual({ title: 'Second', company: 'B' })
  })
})

describe('latestSchool', () => {
  it('has no school without education', () => {
    expect(latestSchool([])).toBeNull()
  })

  it('takes the school that ended last, or one still in progress', () => {
    expect(
      latestSchool([
        school({ institution: 'Old', endDate: '2009-01-01' }),
        school({ id: 2, institution: 'New', endDate: '2012-01-01' }),
      ])
    ).toBe('New')
    expect(
      latestSchool([
        school({ institution: 'Done', endDate: '2012-01-01' }),
        school({ id: 2, institution: 'Now', endDate: null }),
      ])
    ).toBe('Now')
  })
})

describe('needsClamp', () => {
  it('cuts long or many-line text and leaves short text whole', () => {
    expect(needsClamp('Short summary.')).toBe(false)
    expect(needsClamp('x'.repeat(CLAMP_CHARS))).toBe(false)
    expect(needsClamp('x'.repeat(CLAMP_CHARS + 1))).toBe(true)
    expect(needsClamp('a\nb\nc')).toBe(false)
    expect(needsClamp('a\nb\nc\nd')).toBe(true)
  })
})

describe('initialsOf', () => {
  it('uses the first and last name', () => {
    expect(initialsOf('Saber Motamedi')).toBe('SM')
    expect(initialsOf('  mary  jane  watson ')).toBe('MW')
    expect(initialsOf('Cher')).toBe('C')
    expect(initialsOf('  ')).toBe('?')
  })
})
