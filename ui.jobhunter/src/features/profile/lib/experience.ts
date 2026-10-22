import {
  type EmploymentType,
  type ProfileExperience,
  type WorkplaceType,
} from '../api'

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'FullTime', label: 'Full-time' },
  { value: 'PartTime', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Internship', label: 'Internship' },
  { value: 'SelfEmployed', label: 'Self-employed' },
]

export const WORKPLACE_TYPES: { value: WorkplaceType; label: string }[] = [
  { value: 'OnSite', label: 'On-site' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'Remote', label: 'Remote' },
]

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const employmentLabel = (value?: string | null) =>
  EMPLOYMENT_TYPES.find((t) => t.value === value)?.label

export const workplaceLabel = (value?: string | null) =>
  WORKPLACE_TYPES.find((t) => t.value === value)?.label

// Dates arrive as "YYYY-MM-DD"; the profile is month-precision, so the day is always 01.
export const toDateString = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}-01`

export function parseYearMonth(value?: string | null) {
  if (!value) return null
  const [year, month] = value.split('-').map(Number)
  return { year, month }
}

export function formatMonthYear(value?: string | null) {
  const ym = parseYearMonth(value)
  return ym ? `${MONTHS[ym.month - 1].slice(0, 3)} ${ym.year}` : ''
}

const monthIndex = (value: string) => {
  const ym = parseYearMonth(value)!
  return ym.year * 12 + (ym.month - 1)
}

// Inclusive of both months, so Jan 2026 - Oct 2026 is "10 mos" (as LinkedIn shows it).
export function monthsBetween(
  start: string,
  end?: string | null,
  now = new Date()
) {
  const endIndex = end
    ? monthIndex(end)
    : now.getFullYear() * 12 + now.getMonth()
  return Math.max(1, endIndex - monthIndex(start) + 1)
}

export function formatDuration(months: number) {
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts: string[] = []
  if (years > 0) parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`)
  if (rest > 0) parts.push(`${rest} ${rest === 1 ? 'mo' : 'mos'}`)
  return parts.join(' ')
}

export const roleRange = (e: ProfileExperience) =>
  `${formatMonthYear(e.startDate)} - ${e.isCurrent || !e.endDate ? 'Present' : formatMonthYear(e.endDate)}`

export interface CompanyGroup {
  company: string
  roles: ProfileExperience[]
  totalMonths: number
}

// Roles of the same company (trimmed, case-insensitive) are shown together, newest first.
export function groupByCompany(
  experiences: ProfileExperience[]
): CompanyGroup[] {
  const groups = new Map<string, CompanyGroup>()
  const sorted = [...experiences].sort((a, b) =>
    b.startDate.localeCompare(a.startDate)
  )

  for (const role of sorted) {
    const key = role.company.trim().toLowerCase()
    const group = groups.get(key) ?? {
      company: role.company,
      roles: [],
      totalMonths: 0,
    }
    group.roles.push(role)
    groups.set(key, group)
  }

  return [...groups.values()].map((g) => {
    const earliest = g.roles.reduce(
      (m, r) => (r.startDate < m ? r.startDate : m),
      g.roles[0].startDate
    )
    const open = g.roles.some((r) => r.isCurrent || !r.endDate)
    const latestEnd = g.roles.reduce<string | null>(
      (m, r) => (r.endDate && (!m || r.endDate > m) ? r.endDate : m),
      null
    )
    return {
      ...g,
      totalMonths: monthsBetween(earliest, open ? null : latestEnd),
    }
  })
}
