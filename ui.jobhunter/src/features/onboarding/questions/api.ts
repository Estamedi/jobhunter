import { http } from '@/lib/http'
import type { Answers } from './data/questions'

export interface CandidatePreferences {
  candidateId: number
  workStatus?: string
  searchIntensity?: string
  primaryGoal?: string
  targetRoles: string[]
  minSalary?: number
  salaryCurrency?: string
  employmentTypes: string[]
  workModes: string[]
  willingToRelocate?: boolean
  remoteRegions: string[]
  commuteCities: string[]
  workAuthorization?: string
  industries: string[]
}

export const preferencesApi = {
  get: (candidateId: number) =>
    http
      .get<CandidatePreferences>('/api/CandidatePreferences', { params: { candidateId } })
      .then((r) => r.data),

  save: (candidateId: number, answers: Answers) =>
    http.put('/api/CandidatePreferences', {
      candidateId,
      workStatus: answers.workStatus,
      primaryGoal: answers.primaryGoal,
      targetRoles: answers.targetRoles,
      employmentTypes: ['full-time'],
      workModes: answers.workModes,
      remoteRegions: answers.remoteRegions,
      workAuthorization: answers.workAuthorization,
    }),
}
