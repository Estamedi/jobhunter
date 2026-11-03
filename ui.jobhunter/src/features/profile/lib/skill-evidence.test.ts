import { describe, expect, it } from 'vitest'
import { skillLevelLabel, SKILL_EVIDENCE_LEVELS } from './skill-evidence'

describe('skillLevelLabel', () => {
  it('shows nothing when no level is set', () => {
    expect(skillLevelLabel(null)).toBeNull()
    expect(skillLevelLabel(undefined)).toBeNull()
    expect(skillLevelLabel('')).toBeNull()
  })

  it('shows the label of a known level', () => {
    expect(skillLevelLabel('Project')).toBe('Project')
    expect(skillLevelLabel('Learning')).toBe('Learning')
  })

  it('ignores a level it does not know', () => {
    expect(skillLevelLabel('Expert')).toBeNull()
  })

  it('has the five levels the backend accepts', () => {
    expect(SKILL_EVIDENCE_LEVELS.map((l) => l.value)).toEqual([
      'Worked',
      'Project',
      'Course',
      'Learning',
      'Claimed',
    ])
  })
})
