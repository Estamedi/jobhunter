import { http } from '@/lib/http'

export interface ConsultationLead {
  id: number
  created: string
  fullName: string
  email: string
  phone: string | null
  message: string | null
  locale: string | null
}

export interface ConsultationLeadsResult {
  items: ConsultationLead[]
  pageNumber: number
  totalPages: number
  totalCount: number
}

export const consultationsApi = {
  list: (params: { search?: string; page?: number; pageSize?: number } = {}) =>
    http
      .get<ConsultationLeadsResult>('/api/Consultations', { params })
      .then((r) => r.data),
}
