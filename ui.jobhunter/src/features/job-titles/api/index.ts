import { http } from '@/lib/http'

export interface JobTitle {
  id: number
  name: string
  description?: string
  jobRoleCount: number
}

export interface GetJobTitlesResult {
  items: JobTitle[]
  total: number
}

export interface CreateJobTitleDto {
  name: string
  description?: string
}

export const jobTitlesApi = {
  list: (filters: { search?: string; page?: number; pageSize?: number } = {}) =>
    http.get<GetJobTitlesResult>('/api/job-titles', { params: filters }).then((r) => r.data),

  get: (id: number) => http.get<JobTitle>(`/api/job-titles/${id}`).then((r) => r.data),

  create: (dto: CreateJobTitleDto) => http.post<number>('/api/job-titles', dto).then((r) => r.data),

  update: (id: number, dto: Partial<CreateJobTitleDto>) => http.put(`/api/job-titles/${id}`, dto),

  delete: (id: number) => http.delete(`/api/job-titles/${id}`),
}
