import {
  Fragment,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Pencil, Plus, Sparkles } from 'lucide-react'
import { type CvContent, type CvScoreLocation, type CvSection } from '../api'
import {
  headerLinkLabel,
  headerLinkText,
  pickHeaderLink,
} from '../lib/header-link'
import { templateLook } from '../lib/templates'

// Mirrors the backend PDF templates: the colours and spacing come from CSS variables that the page sets
// for the chosen template (see lib/templates.ts), and the section order is the same for all of them.
const HEADING = 'var(--cv-heading)'
const COMPANY = 'var(--cv-company)'
const NAME = 'var(--cv-name)'
const MUTED = 'var(--cv-muted)'

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

const MONTH_NAMES = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
]

// CV dates are free text ("Jul 2025", "2025"); returns a month index or null when unparseable.
function monthIndex(value: string) {
  const year = /\b(\d{4})\b/.exec(value)
  if (!year) return null
  const month = MONTH_NAMES.indexOf(value.trim().slice(0, 3).toLowerCase())
  return Number(year[1]) * 12 + Math.max(month, 0)
}

// Inclusive of both months, like LinkedIn: "Jul 2023 - Jan 2025" is "1 yr 7 mos".
function duration(start?: string | null, end?: string | null) {
  const from = start?.trim() ? monthIndex(start) : null
  if (from === null) return ''
  // A role with no end date, or one that says "Present", is still going, so it runs to this month.
  const open = !end?.trim() || /^present$/i.test(end.trim())
  const to = open
    ? new Date().getFullYear() * 12 + new Date().getMonth()
    : monthIndex(end!)
  if (to === null) return ''
  const months = Math.max(1, to - from + 1)
  const years = Math.floor(months / 12)
  const rest = months % 12
  return [
    years > 0 && `${years} ${years === 1 ? 'yr' : 'yrs'}`,
    rest > 0 && `${rest} ${rest === 1 ? 'mo' : 'mos'}`,
  ]
    .filter(Boolean)
    .join(' ')
}

function experienceRange(start?: string | null, end?: string | null) {
  const range = dateRange(start, end)
  const length = duration(start, end)
  return length ? `${range} · ${length}` : range
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
    <section
      className='group relative'
      style={{ marginTop: 'var(--cv-block)' }}
    >
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

// Marks the lines a score issue points at.
const HIT = 'rounded-sm bg-yellow-200'

export function CvPreview({
  header,
  content,
  onEdit,
  onRefine,
  highlights,
  templateId,
  photoUrl,
}: {
  header: {
    fullName: string
    email?: string
    phone?: string
    location?: string
    availability?: string
  }
  content: CvContent
  onEdit?: (section: CvSection) => void
  onRefine?: (section: CvSection) => void
  // Lines to mark and scroll to, from a score issue.
  highlights?: CvScoreLocation[]
  // Which server template to draw; the colours and spacing follow it.
  templateId?: string
  // The candidate's photo, drawn by the photo template.
  photoUrl?: string | null
}) {
  const look = templateLook(templateId)
  // The photo template shows this link as a QR code and as text, so it is not repeated further down.
  const headerLink = look.photoHeader ? pickHeaderLink(content.links) : null
  const otherLinks = content.links.filter((l) => l !== headerLink)
  const page = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!highlights?.length) return
    page.current
      ?.querySelector('[data-hit]')
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [highlights])

  const hit = (section: string, entry?: number, bullet?: number) =>
    !!highlights?.some(
      (h) =>
        h.section === section &&
        (h.entryIndex ?? undefined) === entry &&
        (h.bulletIndex ?? undefined) === bullet
    )
  const hitSkill = (items: string[]) =>
    !!highlights?.some(
      (h) =>
        h.section === 'skills' &&
        items.some(
          (i) =>
            i.replace(/\*\*/g, '').trim().toLowerCase() === h.text.toLowerCase()
        )
    )
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
      <article
        ref={page}
        className='mx-auto w-full max-w-[794px] bg-white text-[#202124] shadow-sm'
        style={
          {
            ...look.vars,
            fontSize: look.fontSize,
            lineHeight: look.lineHeight,
            padding: look.padding,
          } as CSSProperties
        }
      >
        {look.photoHeader ? (
          <header className='group relative flex items-start gap-4'>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt='Your photo'
                className='h-[120px] w-[90px] shrink-0 object-cover'
              />
            ) : (
              <div className='flex h-[120px] w-[90px] shrink-0 items-center justify-center border border-dashed p-1 text-center text-[10px] text-gray-400'>
                Add your photo on the profile page
              </div>
            )}
            <div className='min-w-0 flex-1'>
              <div className='text-[17px]' style={{ color: NAME }}>
                {header.fullName}
              </div>
              {content.headline && (
                <div
                  className={`text-[17px] font-bold text-black ${hit('headline') ? HIT : ''}`}
                  data-hit={hit('headline') || undefined}
                >
                  {content.headline}
                </div>
              )}
              <div style={{ color: MUTED }}>
                {[
                  ['Residence', header.location],
                  ['Phone', header.phone],
                  ['Email', header.email],
                  ['Availability', header.availability],
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label}>
                      {label}: <strong>{value}</strong>
                    </div>
                  ))}
                {headerLink && (
                  <div>
                    {headerLinkLabel(headerLink)}:{' '}
                    <strong>{headerLinkText(headerLink)}</strong>
                  </div>
                )}
              </div>
            </div>
            {headerLink && (
              <div
                className='flex h-[82px] w-[82px] shrink-0 items-center justify-center border text-center text-[10px] text-gray-500'
                title='The PDF and Word file show a scannable QR code of this link here'
              >
                QR code
              </div>
            )}
            <div className='absolute top-0 right-0'>
              <SectionActions
                title='headline'
                section='headline'
                onEdit={onEdit}
                onRefine={onRefine}
              />
            </div>
          </header>
        ) : (
          <header className='group relative text-center'>
            <div className='text-[22px]' style={{ color: NAME }}>
              {header.fullName}
            </div>
            {content.headline && (
              <div
                className={`text-[17px] font-bold ${hit('headline') ? HIT : ''}`}
                data-hit={hit('headline') || undefined}
                style={{ color: NAME }}
              >
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
        )}

        {content.summary && (
          <Section
            title='Summary'
            section='summary'
            onEdit={onEdit}
            onRefine={onRefine}
          >
            <p
              className={hit('summary') ? HIT : undefined}
              data-hit={hit('summary') || undefined}
            >
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
                <li
                  key={i}
                  className={hitSkill(g.items) ? HIT : undefined}
                  data-hit={hitSkill(g.items) || undefined}
                >
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
                  <div
                    className={`flex items-baseline justify-between gap-4 ${hit('experience', i) ? HIT : ''}`}
                    data-hit={hit('experience', i) || undefined}
                  >
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
                      {experienceRange(job.startDate, job.endDate)}
                    </span>
                  </div>
                  {job.bullets.length > 0 && (
                    <ul className='list-disc pl-5'>
                      {job.bullets.map((b, j) => (
                        <li
                          key={j}
                          className={hit('experience', i, j) ? HIT : undefined}
                          data-hit={hit('experience', i, j) || undefined}
                        >
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

        {otherLinks.length > 0 && (
          <Section
            title='Additional Information'
            section='links'
            onEdit={onEdit}
            onRefine={onRefine}
          >
            {otherLinks.map((l, i) => (
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
        {otherLinks.length === 0 && content.languages.length > 0 && (
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
