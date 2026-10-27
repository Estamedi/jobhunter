import { useState, type ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  type CvContent,
  type CvEducation,
  type CvExperience,
  type CvSection,
} from '../api'
import {
  lines,
  projectsToText,
  skillsToText,
  textToProjects,
  textToSkills,
} from '../lib/cv-text'

// Bullets are edited as one text block and only split into lines on save.
type JobForm = CvExperience & { bulletsText: string }

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='space-y-1'>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

// Edits any subset of a CV's sections. The full editor passes every section; the per-section dialog
// passes one (or two, for "Additional Information"). Only the listed sections are changed on save.
export function SectionEditor({
  content,
  sections,
  isSaving,
  onSave,
  onCancel,
}: {
  content: CvContent
  sections: CvSection[]
  isSaving: boolean
  onSave: (content: CvContent) => void
  onCancel: () => void
}) {
  const has = (s: CvSection) => sections.includes(s)

  const [headline, setHeadline] = useState(content.headline)
  const [summary, setSummary] = useState(content.summary)
  const [skills, setSkills] = useState(skillsToText(content.skills))
  const [projects, setProjects] = useState(projectsToText(content.projects))
  const [jobs, setJobs] = useState<JobForm[]>(
    content.experience.map((j) => ({ ...j, bulletsText: j.bullets.join('\n') }))
  )
  const [education, setEducation] = useState<CvEducation[]>(content.education)
  const [certifications, setCertifications] = useState(
    content.certifications.join('\n')
  )
  const [languages, setLanguages] = useState(content.languages.join('\n'))
  const [links, setLinks] = useState(content.links.join('\n'))

  const patchJob = (index: number, patch: Partial<JobForm>) =>
    setJobs((list) =>
      list.map((j, i) => (i === index ? { ...j, ...patch } : j))
    )

  const patchEducation = (index: number, patch: Partial<CvEducation>) =>
    setEducation((list) =>
      list.map((e, i) => (i === index ? { ...e, ...patch } : e))
    )

  const submit = () => {
    const next: CvContent = { ...content }
    if (has('headline')) next.headline = headline.trim()
    if (has('summary')) next.summary = summary.trim()
    if (has('skills')) next.skills = textToSkills(skills)
    if (has('projects')) next.projects = textToProjects(projects)
    if (has('experience')) {
      next.experience = jobs
        .map(({ bulletsText, ...job }) => ({
          ...job,
          bullets: lines(bulletsText),
        }))
        .filter((j) => j.company.trim() || j.role.trim())
    }
    if (has('education')) {
      next.education = education.filter(
        (e) => e.institution.trim() || e.degree.trim()
      )
    }
    if (has('certifications')) next.certifications = lines(certifications)
    if (has('languages')) next.languages = lines(languages)
    if (has('links')) next.links = lines(links)
    onSave(next)
  }

  return (
    <form
      className='space-y-4'
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      {has('headline') && (
        <Field label='Headline'>
          <Input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </Field>
      )}
      {has('summary') && (
        <Field label='Summary (use **bold** for emphasis)'>
          <Textarea
            rows={6}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </Field>
      )}
      {has('skills') && (
        <Field label='Skills (one group per line: Category: a, b, c)'>
          <Textarea
            rows={5}
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </Field>
      )}
      {has('projects') && (
        <Field label='Projects (one per line: name | description | url)'>
          <Textarea
            rows={4}
            value={projects}
            onChange={(e) => setProjects(e.target.value)}
          />
        </Field>
      )}

      {has('experience') && (
        <div className='space-y-3'>
          {jobs.map((job, i) => (
            <div key={i} className='space-y-2 rounded-md border p-3'>
              <div className='flex items-center justify-between'>
                <p className='text-sm font-medium'>Experience {i + 1}</p>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 text-destructive'
                  title='Remove this role'
                  onClick={() => setJobs((l) => l.filter((_, j) => j !== i))}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
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
                rows={5}
                placeholder='One bullet per line'
                value={job.bulletsText}
                onChange={(e) => patchJob(i, { bulletsText: e.target.value })}
              />
            </div>
          ))}
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() =>
              setJobs((l) => [
                ...l,
                { role: '', company: '', bullets: [], bulletsText: '' },
              ])
            }
          >
            <Plus className='mr-1 h-4 w-4' /> Add role
          </Button>
        </div>
      )}

      {has('education') && (
        <div className='space-y-3'>
          {education.map((edu, i) => (
            <div key={i} className='space-y-2 rounded-md border p-3'>
              <div className='flex items-center justify-between'>
                <p className='text-sm font-medium'>Education {i + 1}</p>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 text-destructive'
                  title='Remove this entry'
                  onClick={() =>
                    setEducation((l) => l.filter((_, j) => j !== i))
                  }
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
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
                  onChange={(e) =>
                    patchEducation(i, { degree: e.target.value })
                  }
                />
                <Input
                  placeholder='Start'
                  value={edu.startDate ?? ''}
                  onChange={(e) =>
                    patchEducation(i, { startDate: e.target.value })
                  }
                />
                <Input
                  placeholder='End'
                  value={edu.endDate ?? ''}
                  onChange={(e) =>
                    patchEducation(i, { endDate: e.target.value })
                  }
                />
              </div>
              <Input
                placeholder='Details (optional)'
                value={edu.details ?? ''}
                onChange={(e) => patchEducation(i, { details: e.target.value })}
              />
            </div>
          ))}
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() =>
              setEducation((l) => [...l, { degree: '', institution: '' }])
            }
          >
            <Plus className='mr-1 h-4 w-4' /> Add education
          </Button>
        </div>
      )}

      {has('certifications') && (
        <Field label='Certifications (one per line)'>
          <Textarea
            rows={3}
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
          />
        </Field>
      )}
      {has('languages') && (
        <Field label='Languages (one per line)'>
          <Textarea
            rows={3}
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
          />
        </Field>
      )}
      {has('links') && (
        <Field label='Links (one per line)'>
          <Textarea
            rows={3}
            value={links}
            onChange={(e) => setLinks(e.target.value)}
          />
        </Field>
      )}

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
