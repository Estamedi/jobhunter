import { type CvProject, type CvSkillGroup } from '../api'

// The editor shows list fields as plain text, one item per line, and only parses them on save so that
// spaces and blank lines can be typed freely.
export const lines = (value: string) =>
  value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

export const skillsToText = (skills: CvSkillGroup[]) =>
  skills.map((g) => `${g.category}: ${g.items.join(', ')}`).join('\n')

export const textToSkills = (text: string): CvSkillGroup[] =>
  lines(text).map((line) => {
    const idx = line.indexOf(':')
    const category = idx >= 0 ? line.slice(0, idx).trim() : ''
    const rest = idx >= 0 ? line.slice(idx + 1) : line
    return {
      category,
      items: rest
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    }
  })

export const projectsToText = (projects: CvProject[]) =>
  projects
    .map((p) => [p.name, p.description ?? '', p.url ?? ''].join(' | '))
    .join('\n')

export const textToProjects = (text: string): CvProject[] =>
  lines(text).map((line) => {
    const [name, description, url] = line.split('|').map((s) => s.trim())
    return { name, description: description || null, url: url || null }
  })
