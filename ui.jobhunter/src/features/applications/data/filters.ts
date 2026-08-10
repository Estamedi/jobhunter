export interface ApplicationFilters {
  search: string
  status?: string
  priority: string[]
  workType: string[]
  employmentType: string[]
  country: string
  jobTitle: string
  salaryMin?: number
  salaryMax?: number
  appliedFrom?: Date
  appliedTo?: Date
  followUpFrom?: Date
  followUpTo?: Date
  followUpStatus?: string
}

export const DEFAULT_FILTERS: ApplicationFilters = {
  search: '',
  status: undefined,
  priority: [],
  workType: [],
  employmentType: [],
  country: '',
  jobTitle: '',
  salaryMin: undefined,
  salaryMax: undefined,
  appliedFrom: undefined,
  appliedTo: undefined,
  followUpFrom: undefined,
  followUpTo: undefined,
  followUpStatus: undefined,
}

// Shared by both the List and Kanban queries so they can never drift out of sync on filter shape.
export function toApiFilters(filters: ApplicationFilters) {
  return {
    search: filters.search || undefined,
    status: filters.status,
    priority: filters.priority.length ? filters.priority : undefined,
    workType: filters.workType.length ? filters.workType : undefined,
    employmentType: filters.employmentType.length ? filters.employmentType : undefined,
    country: filters.country || undefined,
    jobTitle: filters.jobTitle || undefined,
    salaryMin: filters.salaryMin,
    salaryMax: filters.salaryMax,
    dateFrom: filters.appliedFrom?.toISOString(),
    dateTo: filters.appliedTo?.toISOString(),
    followUpFrom: filters.followUpFrom?.toISOString(),
    followUpTo: filters.followUpTo?.toISOString(),
    followUpStatus: filters.followUpStatus,
  }
}

export function hasActiveFilters(filters: ApplicationFilters): boolean {
  return Boolean(
    filters.search ||
      filters.status ||
      filters.priority.length ||
      filters.workType.length ||
      filters.employmentType.length ||
      filters.country ||
      filters.jobTitle ||
      filters.salaryMin !== undefined ||
      filters.salaryMax !== undefined ||
      filters.appliedFrom ||
      filters.appliedTo ||
      filters.followUpFrom ||
      filters.followUpTo ||
      filters.followUpStatus
  )
}
