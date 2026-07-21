import { http } from '@/lib/http'

export interface JobActivity {
  id: number
  candidateId: number
  candidateName?: string
  applicationId?: number
  companyId?: number
  companyName?: string
  contactId?: number
  contactName?: string
  type: string
  activityDate: string
  outcome?: string
  notes?: string
}

export interface GetActivitiesResult {
  items: JobActivity[]
  total: number
}

export interface CreateActivityDto {
  candidateId: number
  applicationId?: number
  companyId?: number
  contactId?: number
  type?: string
  activityDate?: string
  outcome?: string
  notes?: string
}

export const activitiesApi = {
  list: (filters: { candidateId?: number; applicationId?: number; companyId?: number; type?: string; page?: number; pageSize?: number } = {}) =>
    http.get<GetActivitiesResult>('/api/activities', { params: filters }).then((r) => r.data),

  create: (dto: CreateActivityDto) =>
    http.post<number>('/api/activities', dto).then((r) => r.data),

  update: (id: number, dto: Partial<CreateActivityDto>) =>
    http.put(`/api/activities/${id}`, { ...dto, id }),

  delete: (id: number) =>
    http.delete(`/api/activities/${id}`),
}
