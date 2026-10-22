import { describe, expect, it } from 'vitest'
import { type ProfileExperience } from '../api'
import {
  educationRange,
  formatDuration,
  formatMonthYear,
  groupByCompany,
  monthsBetween,
  parseYearMonth,
  roleRange,
  toDateString,
  yearToDate,
} from './experience'

const NOW = new Date(2026, 9, 22) // October 2026

const role = (overrides: Partial<ProfileExperience>): ProfileExperience => ({
  id: 1,
  title: 'Developer',
  company: 'Acme',
  isCurrent: false,
  startDate: '2020-01-01',
  endDate: '2021-01-01',
  skills: [],
  ...overrides,
})

describe('dates', () => {
  it('builds and parses month-precision dates', () => {
    expect(toDateString(2026, 3)).toBe('2026-03-01')
    expect(parseYearMonth('2026-03-01')).toEqual({ year: 2026, month: 3 })
    expect(parseYearMonth(null)).toBeNull()
  })

  it('formats months, years and ranges', () => {
    expect(formatMonthYear('2026-01-01')).toBe('Jan 2026')
    expect(formatMonthYear(undefined)).toBe('')
    expect(educationRange('2010-01-01', '2012-01-01')).toBe('2010 - 2012')
    expect(educationRange(null, '2012-01-01')).toBe('2012')
    expect(yearToDate('2024')).toBe('2024-01-01')
    expect(yearToDate('')).toBeNull()
  })
})

describe('duration', () => {
  it('counts both months like LinkedIn does', () => {
    expect(monthsBetween('2026-01-01', null, NOW)).toBe(10)
    expect(monthsBetween('2025-01-01', null, NOW)).toBe(22)
    expect(monthsBetween('2022-05-01', '2023-07-01', NOW)).toBe(15)
  })

  it('never returns less than one month', () => {
    expect(monthsBetween('2026-10-01', '2026-10-01', NOW)).toBe(1)
    expect(monthsBetween('2026-12-01', null, NOW)).toBe(1)
  })

  it('formats years and months with singular and plural units', () => {
    expect(formatDuration(1)).toBe('1 mo')
    expect(formatDuration(10)).toBe('10 mos')
    expect(formatDuration(12)).toBe('1 yr')
    expect(formatDuration(22)).toBe('1 yr 10 mos')
    expect(formatDuration(27)).toBe('2 yrs 3 mos')
  })
})

describe('roleRange', () => {
  it('shows Present for current roles', () => {
    expect(roleRange(role({ isCurrent: true, endDate: null }))).toBe(
      'Jan 2020 - Present'
    )
  })

  it('shows the end month for past roles', () => {
    expect(roleRange(role({}))).toBe('Jan 2020 - Jan 2021')
  })
})

describe('groupByCompany', () => {
  it('groups roles of the same company, ignoring case and spacing, newest first', () => {
    const groups = groupByCompany([
      role({
        id: 1,
        title: 'Full Stack Developer',
        company: 'AMAN',
        startDate: '2025-01-01',
        endDate: '2025-12-01',
      }),
      role({
        id: 2,
        title: 'Technical Lead',
        company: ' aman ',
        startDate: '2026-01-01',
        endDate: null,
        isCurrent: true,
      }),
      role({
        id: 3,
        title: 'Developer',
        company: 'Totally Tech',
        startDate: '2023-07-01',
        endDate: '2025-01-01',
      }),
    ])

    expect(groups.map((g) => g.company)).toEqual(['aman', 'Totally Tech'])
    expect(groups[0].roles.map((r) => r.id)).toEqual([2, 1])
  })

  it('totals a company from its earliest start to now while a role is current', () => {
    const [group] = groupByCompany([
      role({
        id: 1,
        company: 'AMAN',
        startDate: '2025-01-01',
        endDate: '2025-12-01',
      }),
      role({
        id: 2,
        company: 'AMAN',
        startDate: '2026-01-01',
        endDate: null,
        isCurrent: true,
      }),
    ])

    const expected = monthsBetween('2025-01-01', null)
    expect(group.totalMonths).toBe(expected)
  })

  it('totals a finished company from earliest start to latest end', () => {
    const [group] = groupByCompany([
      role({
        id: 1,
        company: 'Old Co',
        startDate: '2018-01-01',
        endDate: '2019-06-01',
      }),
      role({
        id: 2,
        company: 'Old Co',
        startDate: '2019-07-01',
        endDate: '2020-12-01',
      }),
    ])

    expect(group.totalMonths).toBe(36)
  })

  it('returns no groups for no experience', () => {
    expect(groupByCompany([])).toEqual([])
  })
})
