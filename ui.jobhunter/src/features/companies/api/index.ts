import { http } from '@/lib/http'

export interface JobCompany {
  id: number
  name: string
  website?: string
  linkedInUrl?: string
  country?: string
  city?: string
  industry?: string
  companySize?: string
  priority: string
  notes?: string
}

export interface GetCompaniesResult {
  items: JobCompany[]
  total: number
}

export interface CreateCompanyDto {
  name: string
  website?: string
  linkedInUrl?: string
  country?: string
  city?: string
  industry?: string
  companySize?: string
  priority?: string
  notes?: string
}

export const companiesApi = {
  list: (filters: { search?: string; priority?: string; country?: string; page?: number; pageSize?: number } = {}) =>
    http.get<GetCompaniesResult>('/api/companies', { params: filters }).then((r) => r.data),

  get: (id: number) =>
    http.get<JobCompany>(`/api/companies/${id}`).then((r) => r.data),

  create: (dto: CreateCompanyDto) =>
    http.post<number>('/api/companies', dto).then((r) => r.data),

  update: (id: number, dto: Partial<CreateCompanyDto>) =>
    http.put(`/api/companies/${id}`, { ...dto, id }),

  delete: (id: number) =>
    http.delete(`/api/companies/${id}`),
}
