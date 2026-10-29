import { describe, expect, it } from 'vitest'
import { type RequirementMatch } from '../api'
import { jobFit } from './job-fit'

const req = (
  name: string,
  status: RequirementMatch['status'],
  mustHave = true
): RequirementMatch => ({ name, status, mustHave })

describe('jobFit', () => {
  it('counts only must-have skills, by where they appear', () => {
    const fit = jobFit([
      req('Cloud', 'InCv'),
      req('SQL', 'SkillsOnly'),
      req('Python', 'SkillsOnly'),
      req('Data', 'InProfile'),
      req('Git', 'Missing'),
      req('LLMs', 'Missing', false),
    ])
    expect(fit).toEqual({
      total: 5,
      inCv: 1,
      skillsOnly: 2,
      inProfile: 1,
      missing: 1,
    })
  })

  it('does not count a skills-list mention as covered', () => {
    expect(jobFit([req('SQL', 'SkillsOnly')]).inCv).toBe(0)
  })
})
