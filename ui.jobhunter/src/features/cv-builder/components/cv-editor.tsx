import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type CvContent, type CvExperience } from '../api'

const lines = (value: string) =>
  value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

const skillsToText = (c: CvContent) =>
  c.skills.map((g) => `${g.category}: ${g.items.join(', ')}`).join('\n')

const textToSkills = (text: string) =>
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

const projectsToText = (c: CvContent) =>
  c.projects
    .map((p) => [p.name, p.description ?? '', p.url ?? ''].join(' | '))
    .join('\n')

const textToProjects = (text: string) =>
  lines(text).map((line) => {
    const [name, description, url] = line.split('|').map((s) => s.trim())
    return { name, description: description || null, url: url || null }
  })

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='space-y-1'>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export function CvEditor({
  content,
  isSaving,
  onSave,
  onCancel,
}: {
  content: CvContent
  isSaving: boolean
  onSave: (content: CvContent) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<CvContent>(content)
  const [skills, setSkills] = useState(skillsToText(content))
  const [projects, setProjects] = useState(projectsToText(content))

  const patchJob = (index: number, patch: Partial<CvExperience>) =>
    setDraft((d) => ({
      ...d,
      experience: d.experience.map((job, i) =>
        i === index ? { ...job, ...patch } : job
      ),
    }))

  const patchEducation = (
    index: number,
    patch: Partial<CvContent['education'][number]>
  ) =>
    setDraft((d) => ({
      ...d,
      education: d.education.map((e, i) =>
        i === index ? { ...e, ...patch } : e
      ),
    }))

  return (
    <form
      className='space-y-4'
      onSubmit={(e) => {
        e.preventDefault()
        onSave({
          ...draft,
          skills: textToSkills(skills),
          projects: textToProjects(projects),
        })
      }}
    >
      <Field label='Headline'>
        <Input
          value={draft.headline}
          onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
        />
      </Field>
      <Field label='Summary (use **bold** for emphasis)'>
        <Textarea
          rows={5}
          value={draft.summary}
          onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
        />
      </Field>
      <Field label='Skills (one group per line: Category: a, b, c)'>
        <Textarea
          rows={5}
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
      </Field>
      <Field label='Projects (one per line: name | description | url)'>
        <Textarea
          rows={3}
          value={projects}
          onChange={(e) => setProjects(e.target.value)}
        />
      </Field>

      {draft.experience.map((job, i) => (
        <div key={i} className='space-y-2 rounded-md border p-3'>
          <p className='text-sm font-medium'>Experience {i + 1}</p>
          <div className='grid grid-cols-2 gap-2'>
            <Input
              placeholder='Company'
              value={job.company}
              onChange={(e) => patchJob(i, { company: e.target.value })}
            />
            <Input
              placeholder='Role'
              value={job.role}
              onChange={(e) => patchJob(i, { role: e.target.value })}
            />
            <Input
              placeholder='Location'
              value={job.location ?? ''}
              onChange={(e) => patchJob(i, { location: e.target.value })}
            />
            <div className='grid grid-cols-2 gap-2'>
              <Input
                placeholder='Start'
                value={job.startDate ?? ''}
                onChange={(e) => patchJob(i, { startDate: e.target.value })}
              />
              <Input
                placeholder='End'
                value={job.endDate ?? ''}
                onChange={(e) => patchJob(i, { endDate: e.target.value })}
              />
            </div>
          </div>
          <Textarea
            rows={4}
            placeholder='One bullet per line'
            value={job.bullets.join('\n')}
            onChange={(e) => patchJob(i, { bullets: lines(e.target.value) })}
          />
        </div>
      ))}

      {draft.education.map((edu, i) => (
        <div key={i} className='space-y-2 rounded-md border p-3'>
          <p className='text-sm font-medium'>Education {i + 1}</p>
          <div className='grid grid-cols-2 gap-2'>
            <Input
              placeholder='Institution'
              value={edu.institution}
              onChange={(e) =>
                patchEducation(i, { institution: e.target.value })
              }
            />
            <Input
              placeholder='Degree'
              value={edu.degree}
              onChange={(e) => patchEducation(i, { degree: e.target.value })}
            />
            <Input
              placeholder='Start'
              value={edu.startDate ?? ''}
              onChange={(e) => patchEducation(i, { startDate: e.target.value })}
            />
            <Input
              placeholder='End'
              value={edu.endDate ?? ''}
              onChange={(e) => patchEducation(i, { endDate: e.target.value })}
            />
          </div>
        </div>
      ))}

      <Field label='Certifications (one per line)'>
        <Textarea
          rows={2}
          value={draft.certifications.join('\n')}
          onChange={(e) =>
            setDraft({ ...draft, certifications: lines(e.target.value) })
          }
        />
      </Field>
      <Field label='Languages (one per line)'>
        <Textarea
          rows={2}
          value={draft.languages.join('\n')}
          onChange={(e) =>
            setDraft({ ...draft, languages: lines(e.target.value) })
          }
        />
      </Field>
      <Field label='Links (one per line)'>
        <Textarea
          rows={2}
          value={draft.links.join('\n')}
          onChange={(e) => setDraft({ ...draft, links: lines(e.target.value) })}
        />
      </Field>

      <div className='flex justify-end gap-2'>
        <Button type='button' variant='outline' onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit' disabled={isSaving}>
          Save changes
        </Button>
      </div>
    </form>
  )
}
