import { http } from '@/lib/http'

export interface JobInterview {
  id: number
  applicationId: number
  candidateId: number
  candidateName?: string
  companyId: number
  companyName?: string
  jobRoleTitle?: string
  round: string
  interviewDate: string
  durationMinutes?: number
  interviewerName?: string
  interviewerEmail?: string
  meetingLink?: string
  status: string
  preparationNotes?: string
  interviewNotes?: string
  feedback?: string
}

export interface GetInterviewsResult {
  items: JobInterview[]
  total: number
}

export interface CreateInterviewDto {
  applicationId: number
  candidateId: number
  companyId: number
  round?: string
  interviewDate: string
  durationMinutes?: number
  interviewerName?: string
  interviewerEmail?: string
  meetingLink?: string
  status?: string
  preparationNotes?: string
}

export const interviewsApi = {
  list: (filters: { candidateId?: number; applicationId?: number; companyId?: number; status?: string; page?: number; pageSize?: number } = {}) =>
    http.get<GetInterviewsResult>('/api/interviews', { params: filters }).then((r) => r.data),

  upcoming: () =>
    http.get<GetInterviewsResult>('/api/interviews/upcoming').then((r) => r.data),

  create: (dto: CreateInterviewDto) =>
    http.post<number>('/api/interviews', dto).then((r) => r.data),

  update: (id: number, dto: Partial<CreateInterviewDto>) =>
    http.put(`/api/interviews/${id}`, { ...dto, id }),

  delete: (id: number) =>
    http.delete(`/api/interviews/${id}`),
}
