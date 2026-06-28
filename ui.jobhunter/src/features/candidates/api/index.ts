import { http } from '@/lib/http'

export interface Candidate {
  id: number
  fullName: string
  email: string
  phone?: string
  currentLocation?: string
  targetCountries?: string
  preferredWorkType: string
  targetRoles?: string
  isActive: boolean
  notes?: string
  created: string
}

export interface GetCandidatesResult {
  items: Candidate[]
  total: number
}

export interface CandidateFilters {
  search?: string
  isActive?: boolean
  page?: number
  pageSize?: number
}

export interface CreateCandidateDto {
  fullName: string
  email: string
  phone?: string
  currentLocation?: string
  targetCountries?: string
  preferredWorkType?: string
  targetRoles?: string
  notes?: string
}

export const candidatesApi = {
  list: (filters: CandidateFilters = {}) =>
    http.get<GetCandidatesResult>('/api/candidates', { params: filters }).then((r) => r.data),

  get: (id: number) =>
    http.get<Candidate>(`/api/candidates/${id}`).then((r) => r.data),

  create: (dto: CreateCandidateDto) =>
    http.post<number>('/api/candidates', dto).then((r) => r.data),

  update: (id: number, dto: Partial<CreateCandidateDto>) =>
    http.put(`/api/candidates/${id}`, dto),

  archive: (id: number) =>
    http.patch(`/api/candidates/${id}/archive`),

  delete: (id: number) =>
    http.delete(`/api/candidates/${id}`),
}
