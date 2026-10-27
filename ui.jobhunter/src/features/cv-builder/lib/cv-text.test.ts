import { describe, expect, it } from 'vitest'
import {
  lines,
  projectsToText,
  skillsToText,
  textToProjects,
  textToSkills,
} from './cv-text'

describe('cv text helpers', () => {
  it('splits lines, trimming and dropping blanks', () => {
    expect(lines(' a \n\n b\n')).toEqual(['a', 'b'])
  })

  it('round-trips skill groups', () => {
    const groups = [
      { category: 'Backend', items: ['C#', '.NET'] },
      { category: 'Cloud', items: ['Azure'] },
    ]
    expect(textToSkills(skillsToText(groups))).toEqual(groups)
  })

  it('reads a skills line without a category', () => {
    expect(textToSkills('C#, SQL')).toEqual([
      { category: '', items: ['C#', 'SQL'] },
    ])
  })

  it('round-trips projects and turns empty parts into null', () => {
    const projects = [
      { name: 'Detector', description: 'AI', url: 'https://example.com' },
      { name: 'Tool', description: null, url: null },
    ]
    expect(textToProjects(projectsToText(projects))).toEqual(projects)
  })
})
