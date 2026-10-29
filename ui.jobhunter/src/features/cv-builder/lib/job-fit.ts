import { type RequirementMatch } from '../api'

// How well the CV itself covers the job's must-have skills. A skill that only appears in the Skills list
// does not count as covered: recruiters and ATS give more weight to skills shown in the summary or experience.
export function jobFit(requirements: RequirementMatch[]) {
  const must = requirements.filter((r) => r.mustHave)
  const count = (status: RequirementMatch['status']) =>
    must.filter((r) => r.status === status).length
  return {
    total: must.length,
    inCv: count('InCv'),
    skillsOnly: count('SkillsOnly'),
    inProfile: count('InProfile'),
    missing: count('Missing'),
  }
}
