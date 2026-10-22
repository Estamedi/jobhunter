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

export interface ProfileEducation {
  id: number
  institution: string
  degree: string
  fieldOfStudy?: string | null
  location?: string | null
  startDate?: string | null
  endDate?: string | null
  details?: string | null
}

export interface ProfileSkill {
  id: number
  name: string
  category?: string | null
}

export type LanguageProficiency =
  | 'Elementary'
  | 'LimitedWorking'
  | 'ProfessionalWorking'
  | 'FullProfessional'
  | 'NativeOrBilingual'

export interface ProfileProject {
  id: number
  name: string
  description?: string | null
  url?: string | null
  startDate?: string | null
  endDate?: string | null
}

export interface ProfileCertification {
  id: number
  name: string
  issuer?: string | null
  issuedDate?: string | null
  expiryDate?: string | null
  credentialUrl?: string | null
}

export interface ProfileLanguage {
  id: number
  name: string
  proficiency: LanguageProficiency
}

export interface ProfileLink {
  id: number
  label: string
  url: string
}

export type SaveProjectDto = Omit<ProfileProject, 'id'>
export type SaveCertificationDto = Omit<ProfileCertification, 'id'>
export type SaveLanguageDto = Omit<ProfileLanguage, 'id'>
export type SaveLinkDto = Omit<ProfileLink, 'id'>

export interface CandidateProfile {
  id?: number | null
  candidateId: number
  headline?: string | null
  summary?: string | null
  experiences: ProfileExperience[]
  educations: ProfileEducation[]
  skills: ProfileSkill[]
  projects: ProfileProject[]
  certifications: ProfileCertification[]
  languages: ProfileLanguage[]
  links: ProfileLink[]
}

export interface SaveEducationDto {
  institution: string
  degree: string
  fieldOfStudy?: string | null
  location?: string | null
  startDate?: string | null
  endDate?: string | null
  details?: string | null
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

export interface ParsedEducation {
  institution: string
  degree: string
  fieldOfStudy?: string | null
  location?: string | null
  startDate?: string | null
  endDate?: string | null
  details?: string | null
}

export interface ParsedSkill {
  name: string
  category?: string | null
}

export interface ParsedLanguage {
  name: string
  proficiency?: LanguageProficiency | null
}

export interface ParsedProfile {
  headline?: string | null
  summary?: string | null
  experiences: ParsedExperience[]
  educations: ParsedEducation[]
  skills: ParsedSkill[]
  projects: SaveProjectDto[]
  certifications: SaveCertificationDto[]
  languages: ParsedLanguage[]
  links: SaveLinkDto[]
}

export type ImportMode = 'Merge' | 'Replace'

export interface ImportProfileDto {
  candidateId: number
  cvId?: number
  mode: ImportMode
  headline?: string | null
  summary?: string | null
  experiences: SaveExperienceDto[]
  educations: SaveEducationDto[]
  skills: ParsedSkill[]
  projects: SaveProjectDto[]
  certifications: SaveCertificationDto[]
  languages: SaveLanguageDto[]
  links: SaveLinkDto[]
}

export interface UpdateContactDto {
  candidateId: number
  fullName: string
  email: string
  phone?: string | null
  currentLocation?: string | null
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

  updateContact: (dto: UpdateContactDto) =>
    http.put('/api/CandidateProfiles/contact', dto),

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

  addEducation: (candidateId: number, dto: SaveEducationDto) =>
    http
      .post<number>('/api/CandidateProfiles/educations', {
        candidateId,
        ...dto,
      })
      .then((r) => r.data),

  updateEducation: (id: number, dto: SaveEducationDto) =>
    http
      .put(`/api/CandidateProfiles/educations/${id}`, { id, ...dto })
      .then(() => id),

  deleteEducation: (id: number) =>
    http.delete(`/api/CandidateProfiles/educations/${id}`),

  addSkill: (candidateId: number, name: string, category?: string | null) =>
    http
      .post<number>('/api/CandidateProfiles/skills', {
        candidateId,
        name,
        category: category || null,
      })
      .then((r) => r.data),

  deleteSkill: (id: number) =>
    http.delete(`/api/CandidateProfiles/skills/${id}`),

  addProject: (candidateId: number, dto: SaveProjectDto) =>
    http
      .post<number>('/api/CandidateProfiles/projects', { candidateId, ...dto })
      .then((r) => r.data),
  updateProject: (id: number, dto: SaveProjectDto) =>
    http.put(`/api/CandidateProfiles/projects/${id}`, { id, ...dto }),
  deleteProject: (id: number) =>
    http.delete(`/api/CandidateProfiles/projects/${id}`),

  addCertification: (candidateId: number, dto: SaveCertificationDto) =>
    http
      .post<number>('/api/CandidateProfiles/certifications', {
        candidateId,
        ...dto,
      })
      .then((r) => r.data),
  updateCertification: (id: number, dto: SaveCertificationDto) =>
    http.put(`/api/CandidateProfiles/certifications/${id}`, { id, ...dto }),
  deleteCertification: (id: number) =>
    http.delete(`/api/CandidateProfiles/certifications/${id}`),

  addLanguage: (candidateId: number, dto: SaveLanguageDto) =>
    http
      .post<number>('/api/CandidateProfiles/languages', { candidateId, ...dto })
      .then((r) => r.data),
  updateLanguage: (id: number, dto: SaveLanguageDto) =>
    http.put(`/api/CandidateProfiles/languages/${id}`, { id, ...dto }),
  deleteLanguage: (id: number) =>
    http.delete(`/api/CandidateProfiles/languages/${id}`),

  addLink: (candidateId: number, dto: SaveLinkDto) =>
    http
      .post<number>('/api/CandidateProfiles/links', { candidateId, ...dto })
      .then((r) => r.data),
  updateLink: (id: number, dto: SaveLinkDto) =>
    http.put(`/api/CandidateProfiles/links/${id}`, { id, ...dto }),
  deleteLink: (id: number) => http.delete(`/api/CandidateProfiles/links/${id}`),
}
