import { describe, expect, it } from 'vitest'
import { type CvContent } from '../api'
import { diffCv, summarizeChanges } from './cv-diff'

const base: CvContent = {
  headline: 'AI Engineer',
  summary: 'Senior engineer.',
  skills: [{ category: 'AI', items: ['Python', 'SQL'] }],
  projects: [],
  experience: [
    {
      sourceId: 1,
      role: 'Lead',
      company: 'AMAN',
      bullets: ['Built **X**', 'Led team'],
    },
  ],
  education: [],
  certifications: [],
  languages: [],
  links: [],
}

describe('diffCv', () => {
  it('reports no changes for identical content', () => {
    expect(diffCv(base, structuredClone(base))).toEqual([])
    expect(summarizeChanges([])).toMatch(/No visible difference/)
  })

  it('ignores bold markers and case', () => {
    const after = structuredClone(base)
    after.experience[0].bullets = ['Built X', 'led team']
    expect(diffCv(base, after)).toEqual([])
  })

  it('reports added and removed skills and rewritten summary', () => {
    const after = structuredClone(base)
    after.skills = [{ category: 'AI', items: ['Python', 'MLOps', 'Git'] }]
    after.summary = 'New summary.'
    const changes = diffCv(base, after)
    const skills = changes.find((c) => c.label === 'Skills')!
    expect(skills.added).toEqual(['MLOps', 'Git'])
    expect(skills.removed).toEqual(['SQL'])
    expect(skills.summary).toBe('2 added, 1 removed')
    expect(changes.find((c) => c.label === 'Summary')!.summary).toBe(
      'rewritten'
    )
  })

  it('reports changed bullets under the matching role', () => {
    const after = structuredClone(base)
    after.experience[0].bullets = ['Led team', 'Shipped Y']
    const c = diffCv(base, after)[0]
    expect(c.label).toBe('Experience · Lead at AMAN')
    expect(c.added).toEqual(['Shipped Y'])
    expect(c.removed).toEqual(['Built X'])
  })
})
