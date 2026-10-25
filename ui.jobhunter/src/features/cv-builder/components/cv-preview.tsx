import { Fragment, type ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
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

function Section({
  title,
  section,
  onRefine,
  children,
}: {
  title: string
  section: CvSection
  onRefine?: (section: CvSection) => void
  children: ReactNode
}) {
  return (
    <section className='group relative mt-3'>
      <h2 className='text-[13px] font-bold' style={{ color: HEADING }}>
        {title}
      </h2>
      {onRefine && (
        <button
          type='button'
          title={`Refine ${title} with AI`}
          onClick={() => onRefine(section)}
          className='absolute top-0 right-0 flex items-center gap-1 rounded border bg-white px-1.5 py-0.5 text-[11px] text-gray-600 opacity-0 transition-opacity group-hover:opacity-100'
        >
          <Sparkles className='h-3 w-3' /> Refine
        </button>
      )}
      <div className='mt-0.5'>{children}</div>
    </section>
  )
}

export function CvPreview({
  header,
  content,
  onRefine,
}: {
  header: {
    fullName: string
    email?: string
    phone?: string
    location?: string
  }
  content: CvContent
  onRefine?: (section: CvSection) => void
}) {
  const contact = [
    { label: 'Resident', value: header.location },
    { label: 'Phone', value: header.phone },
    { label: 'email', value: header.email },
  ].filter((c) => c.value)

  return (
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
        {onRefine && (
          <button
            type='button'
            onClick={() => onRefine('headline')}
            className='absolute top-0 right-0 flex items-center gap-1 rounded border bg-white px-1.5 py-0.5 text-[11px] text-gray-600 opacity-0 transition-opacity group-hover:opacity-100'
          >
            <Sparkles className='h-3 w-3' /> Refine
          </button>
        )}
      </header>

      {content.summary && (
        <Section title='Summary' section='summary' onRefine={onRefine}>
          <p className='text-justify'>
            <Rich text={content.summary} />
          </p>
        </Section>
      )}

      {content.skills.length > 0 && (
        <Section
          title='Professional Skills'
          section='skills'
          onRefine={onRefine}
        >
          <ul className='list-disc pl-5'>
            {content.skills.map((g, i) => (
              <li key={i}>
                {g.category && <strong>{g.category}: </strong>}
                {g.items.join(', ')}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {content.projects.length > 0 && (
        <Section title='Recent Projects' section='projects' onRefine={onRefine}>
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
        <Section title='Experience' section='experience' onRefine={onRefine}>
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
                    {job.role && <em style={{ color: MUTED }}>, {job.role}</em>}
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
        <Section title='Education' section='education' onRefine={onRefine}>
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
          onRefine={onRefine}
        >
          <strong>Languages: </strong>
          {content.languages.join(', ')}
        </Section>
      )}
    </article>
  )
}
