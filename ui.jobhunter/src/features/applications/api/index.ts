import { http } from '@/lib/http'

export interface JobApplication {
  id: number
  candidateId: number
  candidateName?: string
  jobRoleId: number
  jobRoleTitle?: string
  jobRoleDescription?: string
  companyId: number
  companyName?: string
  mainContactId?: number
  mainContactName?: string
  cvId?: number
  cvFileName?: string
  status: string
  priority: string
  appliedDate?: string
  lastActivityDate?: string
  nextFollowUpDate?: string
  resumeVersion?: string
  coverLetterVersion?: string
  expectedSalary?: number
  actualOfferSalary?: number
  currency?: string
  rejectionReason?: string
  followUpStatus?: string
}

export interface GetApplicationsResult {
  items: JobApplication[]
  total: number
}

export interface CreateApplicationDto {
  candidateId: number
  jobRoleId: number
  companyId: number
  mainContactId?: number
  cvId?: number
  status?: string
  priority?: string
  appliedDate?: string
  nextFollowUpDate?: string
  resumeVersion?: string
  coverLetterVersion?: string
  expectedSalary?: number
  actualOfferSalary?: number
  currency?: string
  rejectionReason?: string
}

export const applicationsApi = {
  list: (filters: {
    search?: string
    candidateId?: number
    companyId?: number
    status?: string
    priority?: string
    followUpStatus?: string
    page?: number
    pageSize?: number
  } = {}) =>
    http.get<GetApplicationsResult>('/api/applications', { params: filters }).then((r) => r.data),

  get: (id: number) =>
    http.get<JobApplication>(`/api/applications/${id}`).then((r) => r.data),

  followUpsToday: () =>
    http.get<GetApplicationsResult>('/api/applications/follow-ups/today').then((r) => r.data),

  followUpsOverdue: () =>
    http.get<GetApplicationsResult>('/api/applications/follow-ups/overdue').then((r) => r.data),

  followUpsThisWeek: () =>
    http.get<GetApplicationsResult>('/api/applications/follow-ups/week').then((r) => r.data),

  create: (dto: CreateApplicationDto) =>
    http.post<number>('/api/applications', dto).then((r) => r.data),

  update: (id: number, dto: Partial<CreateApplicationDto>) =>
    http.put(`/api/applications/${id}`, { ...dto, id }),

  updateStatus: (id: number, status: string) =>
    http.patch(`/api/applications/${id}/status`, { id, status }),

  delete: (id: number) =>
    http.delete(`/api/applications/${id}`),
}
