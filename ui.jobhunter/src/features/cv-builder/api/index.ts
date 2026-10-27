import { http } from '@/lib/http'

export interface CvSkillGroup {
  category: string
  items: string[]
}

export interface CvProject {
  name: string
  description?: string | null
  url?: string | null
}

export interface CvExperience {
  // Profile row this entry comes from; the server keeps role, company and dates in sync with it.
  sourceId?: number | null
  role: string
  company: string
  location?: string | null
  startDate?: string | null
  endDate?: string | null
  bullets: string[]
}

export interface CvEducation {
  sourceId?: number | null
  degree: string
  institution: string
  startDate?: string | null
  endDate?: string | null
  details?: string | null
}

export interface CvContent {
  headline: string
  summary: string
  skills: CvSkillGroup[]
  projects: CvProject[]
  experience: CvExperience[]
  education: CvEducation[]
  certifications: string[]
  languages: string[]
  links: string[]
}

export type CvSection = keyof CvContent

export interface CvDraft {
  id: number
  candidateId: number
  sourceCvId?: number | null
  jobApplicationId?: number | null
  title: string
  jobTitle: string
  jobDescription?: string | null
  instructions?: string | null
  templateId: string
  content: CvContent
  created: string
  lastModified: string
  // Only present on the response to generate and regenerate.
  warnings?: string[] | null
}

export interface CvDraftSummary {
  id: number
  candidateId: number
  jobApplicationId?: number | null
  title: string
  jobTitle: string
  templateId: string
  created: string
  lastModified: string
}

export interface GetCvDraftsResult {
  items: CvDraftSummary[]
  total: number
}

export interface ExportCvResult {
  cvId: number
  attachedApplicationId?: number | null
  existingCvKept: boolean
}

export interface GenerateCvDraftDto {
  candidateId: number
  jobTitle: string
  title?: string
  jobDescription?: string
  instructions?: string
  backgroundText?: string
  sourceCvId?: number
  jobApplicationId?: number
  tone?: string
  language?: string
}

export interface UpdateCvDraftDto {
  title: string
  templateId: string
  content: CvContent
}

export interface RegenerateSectionDto {
  section: CvSection
  instruction: string
  backgroundText?: string
}

export const cvBuilderApi = {
  list: (
    params: { candidateId?: number; page?: number; pageSize?: number } = {}
  ) =>
    http
      .get<GetCvDraftsResult>('/api/CvGeneration', { params })
      .then((r) => r.data),

  get: (id: number) =>
    http.get<CvDraft>(`/api/CvGeneration/${id}`).then((r) => r.data),

  generate: (dto: GenerateCvDraftDto) =>
    http.post<CvDraft>('/api/CvGeneration', dto).then((r) => r.data),

  update: (id: number, dto: UpdateCvDraftDto) =>
    http
      .put<CvDraft>(`/api/CvGeneration/${id}`, { id, ...dto })
      .then((r) => r.data),

  regenerateSection: (id: number, dto: RegenerateSectionDto) =>
    http
      .post<CvDraft>(`/api/CvGeneration/${id}/regenerate-section`, {
        id,
        ...dto,
      })
      .then((r) => r.data),

  exportPdf: (id: number) =>
    http
      .post<ExportCvResult>(`/api/CvGeneration/${id}/export`)
      .then((r) => r.data),

  delete: (id: number) => http.delete(`/api/CvGeneration/${id}`),
}
