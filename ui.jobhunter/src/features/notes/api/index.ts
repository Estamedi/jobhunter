import { http } from '@/lib/http'

export interface Note {
  id: number
  applicationId?: number
  content: string
  created: string
  lastModified: string
}

export interface GetNotesResult {
  items: Note[]
  total: number
}

export interface NoteFilters {
  applicationId?: number
  page?: number
  pageSize?: number
}

export interface SaveNoteDto {
  content: string
  applicationId?: number
}

export const notesApi = {
  list: (filters: NoteFilters = {}) =>
    http.get<GetNotesResult>('/api/Notes', { params: filters }).then((r) => r.data),

  create: (dto: SaveNoteDto) =>
    http.post<number>('/api/Notes', dto).then((r) => r.data),

  update: (id: number, dto: SaveNoteDto) =>
    http.put(`/api/Notes/${id}`, { id, ...dto }),

  delete: (id: number) => http.delete(`/api/Notes/${id}`),
}
