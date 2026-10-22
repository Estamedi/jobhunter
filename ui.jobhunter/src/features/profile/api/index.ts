import { http } from '@/lib/http'

export type EmploymentType =
  | 'FullTime'
  | 'PartTime'
  | 'Contract'
  | 'Freelance'
  | 'Internship'
  | 'SelfEmployed'

export type WorkplaceType = 'OnSite' | 'Hybrid' | 'Remote'

export interface ProfileExperience {
  id: number
  title: string
  employmentType?: EmploymentType | null
  company: string
  isCurrent: boolean
  startDate: string
  endDate?: string | null
  location?: string | null
  workplaceType?: WorkplaceType | null
  description?: string | null
  skills: string[]
}

export interface CandidateProfile {
  id?: number | null
  candidateId: number
  headline?: string | null
  summary?: string | null
  experiences: ProfileExperience[]
}

export interface SaveExperienceDto {
  title: string
  employmentType?: EmploymentType | null
  company: string
  isCurrent: boolean
  startDate: string
  endDate?: string | null
  location?: string | null
  workplaceType?: WorkplaceType | null
  description?: string | null
  skills: string[]
}

export interface ParsedExperience {
  title: string
  employmentType?: EmploymentType | null
  company: string
  isCurrent: boolean
  startDate?: string | null
  endDate?: string | null
  location?: string | null
  workplaceType?: WorkplaceType | null
  description?: string | null
  skills: string[]
}

export interface ParsedProfile {
  headline?: string | null
  summary?: string | null
  experiences: ParsedExperience[]
}

export type ImportMode = 'Merge' | 'Replace'

export interface ImportProfileDto {
  candidateId: number
  cvId?: number
  mode: ImportMode
  headline?: string | null
  summary?: string | null
  experiences: SaveExperienceDto[]
}

export interface UpdateAboutDto {
  candidateId: number
  headline?: string | null
  summary?: string | null
}

export const profileApi = {
  get: (candidateId: number) =>
    http
      .get<CandidateProfile>('/api/CandidateProfiles', {
        params: { candidateId },
      })
      .then((r) => r.data),

  updateAbout: (dto: UpdateAboutDto) =>
    http.put<number>('/api/CandidateProfiles/about', dto).then((r) => r.data),

  previewImport: (cvId: number) =>
    http
      .post<ParsedProfile>('/api/CandidateProfiles/import-preview', { cvId })
      .then((r) => r.data),

  importProfile: (dto: ImportProfileDto) =>
    http.post<number>('/api/CandidateProfiles/import', dto).then((r) => r.data),

  addExperience: (candidateId: number, dto: SaveExperienceDto) =>
    http
      .post<number>('/api/CandidateProfiles/experiences', {
        candidateId,
        ...dto,
      })
      .then((r) => r.data),

  updateExperience: (id: number, dto: SaveExperienceDto) =>
    http
      .put(`/api/CandidateProfiles/experiences/${id}`, { id, ...dto })
      .then(() => id),

  deleteExperience: (id: number) =>
    http.delete(`/api/CandidateProfiles/experiences/${id}`),
}
