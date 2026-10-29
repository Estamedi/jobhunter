import { Fragment, type ReactNode } from 'react'
import { Pencil, Plus, Sparkles } from 'lucide-react'
import { type CvContent, type CvSection } from '../api'

// Mirrors the backend "classic" PDF template (same palette and section order).
const HEADING = '#4285F4'
const COMPANY = '#1155CC'
const NAME = '#353744'
const MUTED = '#666666'

function Rich({ text }: { text?: string | null }) {
  if (!text) return null
  return (
    <>
      {text
        .split('**')
        .map((part, i) =>
          i % 2 === 1 ? (
            <strong key={i}>{part}</strong>
          ) : (
            <Fragment key={i}>{part}</Fragment>
          )
        )}
    </>
  )
}

function dateRange(start?: string | null, end?: string | null) {
  const to = end?.trim() || (start?.trim() ? 'Present' : '')
  return [start?.trim(), to].filter(Boolean).join(' - ')
}

// Edit and Refine buttons. They sit in the heading row so they never cover the text, show on hover or
// keyboard focus, and are always visible on touch screens.
function SectionActions({
  title,
  section,
  onEdit,
  onRefine,
}: {
  title: string
  section: CvSection
  onEdit?: (section: CvSection) => void
  onRefine?: (section: CvSection) => void
}) {
  if (!onEdit && !onRefine) return null
  const button =
    'flex items-center gap-1 rounded border bg-white px-1.5 py-0.5 text-[11px] text-gray-600 hover:bg-gray-50'
  return (
    <div className='flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100'>
      {onEdit && (
        <button
          type='button'
          title={`Edit ${title} by hand`}
          onClick={() => onEdit(section)}
          className={button}
        >
          <Pencil className='h-3 w-3' /> Edit
        </button>
      )}
      {onRefine && (
        <button
          type='button'
          title={`Refine ${title} with AI`}
          onClick={() => onRefine(section)}
          className={button}
        >
          <Sparkles className='h-3 w-3' /> Refine
        </button>
      )}
    </div>
  )
}

function Section({
  title,
  section,
  onEdit,
  onRefine,
  children,
}: {
  title: string
  section: CvSection
  onEdit?: (section: CvSection) => void
  onRefine?: (section: CvSection) => void
  children: ReactNode
}) {
  return (
    <section className='group relative mt-3'>
      <div className='flex items-center justify-between gap-2'>
        <h2 className='text-[13px] font-bold' style={{ color: HEADING }}>
          {title}
        </h2>
        <SectionActions
          title={title}
          section={section}
          onEdit={onEdit}
          onRefine={onRefine}
        />
      </div>
      <div className='mt-0.5'>{children}</div>
    </section>
  )
}

export function CvPreview({
  header,
  content,
  onEdit,
  onRefine,
}: {
  header: {
    fullName: string
    email?: string
    phone?: string
    location?: string
  }
  content: CvContent
  onEdit?: (section: CvSection) => void
  onRefine?: (section: CvSection) => void
}) {
  // Empty sections are not drawn (the PDF skips them too), so offer a button to add them.
  const missing = [
    !content.summary && { section: 'summary' as const, label: 'Summary' },
    content.skills.length === 0 && {
      section: 'skills' as const,
      label: 'Skills',
    },
    content.projects.length === 0 && {
      section: 'projects' as const,
      label: 'Projects',
    },
    content.experience.length === 0 && {
      section: 'experience' as const,
      label: 'Experience',
    },
    content.education.length === 0 && {
      section: 'education' as const,
      label: 'Education',
    },
    content.certifications.length === 0 && {
      section: 'certifications' as const,
      label: 'Certifications',
    },
    content.links.length === 0 &&
      content.languages.length === 0 && {
        section: 'links' as const,
        label: 'Additional Information',
      },
  ].filter((m) => m !== false)

  const contact = [
    { label: 'Location', value: header.location },
    { label: 'Phone', value: header.phone },
    { label: 'Email', value: header.email },
  ].filter((c) => c.value)

  return (
    <>
      <article className='mx-auto w-full max-w-[794px] bg-white px-12 py-10 text-[12px] leading-[1.35] text-[#202124] shadow-sm'>
        <header className='group relative text-center'>
          <div className='text-[22px]' style={{ color: NAME }}>
            {header.fullName}
          </div>
          {content.headline && (
            <div className='text-[17px] font-bold' style={{ color: NAME }}>
              {content.headline}
            </div>
          )}
          <div className='mt-0.5 text-[12px]' style={{ color: MUTED }}>
            {contact.map((c, i) => (
              <Fragment key={c.label}>
                {i > 0 && ' |  '}
                {c.label}: <strong>{c.value}</strong>
              </Fragment>
            ))}
          </div>
          <div className='absolute top-0 right-0'>
            <SectionActions
              title='headline'
              section='headline'
              onEdit={onEdit}
              onRefine={onRefine}
            />
          </div>
        </header>

        {content.summary && (
          <Section
            title='Summary'
            section='summary'
            onEdit={onEdit}
            onRefine={onRefine}
          >
            <p className='text-justify'>
              <Rich text={content.summary} />
            </p>
          </Section>
        )}

        {content.skills.length > 0 && (
          <Section
            title='Skills'
            section='skills'
            onEdit={onEdit}
            onRefine={onRefine}
          >
            <ul className='list-disc pl-5'>
              {content.skills.map((g, i) => (
                <li key={i}>
                  {g.category && <strong>{g.category}: </strong>}
                  {g.items.join(', ').replace(/\*\*/g, '')}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {content.projects.length > 0 && (
          <Section
            title='Projects'
            section='projects'
            onEdit={onEdit}
            onRefine={onRefine}
          >
            {content.projects.map((p, i) => (
              <div key={i}>
                <strong>{p.name}</strong>
                {p.description && (
                  <>
                    {' '}
                    - <Rich text={p.description} />
                  </>
                )}
                {p.url && (
                  <>
                    {' '}
                    <a
                      href={p.url}
                      target='_blank'
                      rel='noreferrer'
                      style={{ color: COMPANY }}
                      className='underline'
                    >
                      {p.url}
                    </a>
                  </>
                )}
              </div>
            ))}
          </Section>
        )}

        {content.experience.length > 0 && (
          <Section
            title='Experience'
            section='experience'
            onEdit={onEdit}
            onRefine={onRefine}
          >
            <div className='space-y-2'>
              {content.experience.map((job, i) => (
                <div key={i}>
                  <div className='flex items-baseline justify-between gap-4'>
                    <div>
                      <strong style={{ color: COMPANY }}>
                        {job.location
                          ? `${job.company}, ${job.location}`
                          : job.company}
                      </strong>
                      {job.role && (
                        <em style={{ color: MUTED }}>, {job.role}</em>
                      )}
                    </div>
                    <span
                      className='shrink-0 text-[11px]'
                      style={{ color: MUTED }}
                    >
                      {dateRange(job.startDate, job.endDate)}
                    </span>
                  </div>
                  {job.bullets.length > 0 && (
                    <ul className='list-disc pl-5 text-justify'>
                      {job.bullets.map((b, j) => (
                        <li key={j}>
                          <Rich text={b} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {content.education.length > 0 && (
          <Section
            title='Education'
            section='education'
            onEdit={onEdit}
            onRefine={onRefine}
          >
            {content.education.map((e, i) => {
              const dates = dateRange(e.startDate, e.endDate)
              return (
                <div key={i}>
                  <div>{e.institution}</div>
                  <div>
                    {e.degree}
                    {dates && `, ${dates}`}
                    {e.details && ` (${e.details})`}
                  </div>
                </div>
              )
            })}
          </Section>
        )}

        {content.certifications.length > 0 && (
          <Section
            title='Certifications'
            section='certifications'
            onEdit={onEdit}
            onRefine={onRefine}
          >
            <ul className='list-disc pl-5'>
              {content.certifications.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </Section>
        )}

        {content.links.length > 0 && (
          <Section
            title='Additional Information'
            section='links'
            onEdit={onEdit}
            onRefine={onRefine}
          >
            {content.links.map((l, i) => (
              <div key={i}>
                <a
                  href={l.startsWith('http') ? l : `https://${l}`}
                  target='_blank'
                  rel='noreferrer'
                  style={{ color: COMPANY }}
                  className='underline'
                >
                  {l}
                </a>
              </div>
            ))}
            {content.languages.length > 0 && (
              <div className='pt-0.5'>
                <strong>Languages: </strong>
                {content.languages.join(', ')}
              </div>
            )}
          </Section>
        )}
        {content.links.length === 0 && content.languages.length > 0 && (
          <Section
            title='Additional Information'
            section='languages'
            onEdit={onEdit}
            onRefine={onRefine}
          >
            <strong>Languages: </strong>
            {content.languages.join(', ')}
          </Section>
        )}
      </article>
      {onEdit && missing.length > 0 && (
        <div className='mx-auto mt-3 flex w-full max-w-[794px] flex-wrap items-center gap-2 text-xs'>
          <span className='text-muted-foreground'>Add a section:</span>
          {missing.map((m) => (
            <button
              key={m.section}
              type='button'
              onClick={() => onEdit(m.section)}
              className='flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-muted-foreground hover:bg-muted'
            >
              <Plus className='h-3 w-3' /> {m.label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
