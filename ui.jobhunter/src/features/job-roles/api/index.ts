import { http } from '@/lib/http'

export interface JobRole {
  id: number
  companyId: number
  companyName?: string
  jobTitleId?: number
  jobTitleName?: string
  title: string
  jobLink?: string
  source: string
  country?: string
  city?: string
  workType: string
  salaryMin?: number
  salaryMax?: number
  currency?: string
  employmentType: string
  roleStatus: string
  description?: string
  requirements?: string
}

export interface GetJobRolesResult {
  items: JobRole[]
  total: number
}

export interface CreateJobRoleDto {
  companyId: number
  jobTitleId?: number
  title: string
  jobLink?: string
  source?: string
  country?: string
  city?: string
  workType?: string
  salaryMin?: number
  salaryMax?: number
  currency?: string
  employmentType?: string
  roleStatus?: string
  description?: string
  requirements?: string
}

export const jobRolesApi = {
  list: (filters: { search?: string; companyId?: number; jobTitleId?: number; roleStatus?: string; workType?: string; country?: string; source?: string; page?: number; pageSize?: number } = {}) =>
    http.get<GetJobRolesResult>('/api/job-roles', { params: filters }).then((r) => r.data),

  get: (id: number) =>
    http.get<JobRole>(`/api/job-roles/${id}`).then((r) => r.data),

  create: (dto: CreateJobRoleDto) =>
    http.post<number>('/api/job-roles', dto).then((r) => r.data),

  update: (id: number, dto: Partial<CreateJobRoleDto>) =>
    http.put(`/api/job-roles/${id}`, { ...dto, id }),

  delete: (id: number) =>
    http.delete(`/api/job-roles/${id}`),
}
