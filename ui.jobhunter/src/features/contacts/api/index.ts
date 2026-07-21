import { http } from '@/lib/http'

export interface JobContact {
  id: number
  fullName: string
  companyId?: number
  companyName?: string
  jobTitle?: string
  email?: string
  phone?: string
  linkedInUrl?: string
  type: string
  warmth: string
  notes?: string
}

export interface GetContactsResult {
  items: JobContact[]
  total: number
}

export interface CreateContactDto {
  fullName: string
  companyId?: number
  jobTitle?: string
  email?: string
  phone?: string
  linkedInUrl?: string
  type?: string
  warmth?: string
  notes?: string
}

export const contactsApi = {
  list: (filters: { search?: string; companyId?: number; type?: string; warmth?: string; page?: number; pageSize?: number } = {}) =>
    http.get<GetContactsResult>('/api/contacts', { params: filters }).then((r) => r.data),

  get: (id: number) =>
    http.get<JobContact>(`/api/contacts/${id}`).then((r) => r.data),

  create: (dto: CreateContactDto) =>
    http.post<number>('/api/contacts', dto).then((r) => r.data),

  update: (id: number, dto: Partial<CreateContactDto>) =>
    http.put(`/api/contacts/${id}`, { ...dto, id }),

  delete: (id: number) =>
    http.delete(`/api/contacts/${id}`),
}
