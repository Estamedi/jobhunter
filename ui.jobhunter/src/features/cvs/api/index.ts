import { http } from '@/lib/http'

export interface Cv {
  id: number
  candidateId: number
  applicationId?: number
  fileName: string
  contentType: string
  fileSizeBytes: number
  uploadedDate: string
}

export interface GetCvsResult {
  items: Cv[]
  total: number
}

export interface CvFilters {
  candidateId?: number
  applicationId?: number
  page?: number
  pageSize?: number
}

export interface UploadCvDto {
  candidateId: number
  applicationId?: number
  file: File
}

export const cvsApi = {
  list: (filters: CvFilters = {}) =>
    http.get<GetCvsResult>('/api/Cvs', { params: filters }).then((r) => r.data),

  upload: (dto: UploadCvDto) => {
    const formData = new FormData()
    formData.append('candidateId', String(dto.candidateId))
    if (dto.applicationId != null) {
      formData.append('applicationId', String(dto.applicationId))
    }
    formData.append('file', dto.file)

    // The shared `http` instance defaults to Content-Type: application/json; unset it here
    // so the browser can set the correct multipart/form-data boundary for this request.
    return http
      .post<number>('/api/Cvs', formData, { headers: { 'Content-Type': undefined } })
      .then((r) => r.data)
  },

  download: (id: number) =>
    http.get<Blob>(`/api/Cvs/${id}/download`, { responseType: 'blob' }).then((r) => r.data),

  delete: (id: number) => http.delete(`/api/Cvs/${id}`),
}
