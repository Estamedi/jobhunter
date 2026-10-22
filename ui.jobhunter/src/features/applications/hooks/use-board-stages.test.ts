import { describe, expect, it } from 'vitest'
import { formatStatusLabel } from '../data/constants'
import { isLegacyDefaultStages, type BoardStage } from './use-board-stages'

const LEGACY = [
  'Wishlist',
  'Applied',
  'PhoneScreen',
  'HRInterview',
  'TechnicalInterview',
  'FinalInterview',
  'Offer',
  'Accepted',
  'Rejected',
  'Withdrawn',
  'Ghosted',
]

const stage = (
  status: string,
  overrides: Partial<BoardStage> = {}
): BoardStage => ({
  status,
  label: formatStatusLabel(status),
  badgeVariant: 'secondary',
  visible: true,
  ...overrides,
})

describe('isLegacyDefaultStages', () => {
  it('recognises the old untouched default stages', () => {
    expect(isLegacyDefaultStages(LEGACY.map((s) => stage(s)))).toBe(true)
  })

  it('does not match the new simple defaults', () => {
    const simple = ['Wishlist', 'Applied', 'Interview', 'Rejected'].map((s) =>
      stage(s)
    )
    expect(isLegacyDefaultStages(simple)).toBe(false)
  })

  it('keeps customized boards: renamed, hidden, reordered, added or removed stages', () => {
    const base = LEGACY.map((s) => stage(s))
    expect(
      isLegacyDefaultStages(
        base.map((s) => (s.status === 'Offer' ? { ...s, label: 'Offers!' } : s))
      )
    ).toBe(false)
    expect(
      isLegacyDefaultStages(
        base.map((s) => (s.status === 'Ghosted' ? { ...s, visible: false } : s))
      )
    ).toBe(false)
    expect(isLegacyDefaultStages([base[1], base[0], ...base.slice(2)])).toBe(
      false
    )
    expect(isLegacyDefaultStages([...base, stage('Archived')])).toBe(false)
    expect(isLegacyDefaultStages(base.slice(0, -1))).toBe(false)
  })
})
