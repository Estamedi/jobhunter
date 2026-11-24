import { Building2, Gem, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { type ProfileExperience } from '../api'
import {
  MONTHS,
  employmentLabel,
  groupByCompany,
  monthsBetween,
  parseYearMonth,
  workplaceLabel,
} from '../lib/experience'
import { ExpandableText } from './expandable-text'
import { ProfileCard } from './profile-card'

const MAX_SKILLS_SHOWN = 2

// Localised counterparts of the English helpers in lib/experience, which this section can't use directly.
function useFormatters() {
  const { t } = useTranslation()
  const formatDuration = (months: number) => {
    const years = Math.floor(months / 12)
    const rest = months % 12
    const parts: string[] = []
    if (years > 0)
      parts.push(`${years} ${years === 1 ? t('yr') : t('yrs')}`)
    if (rest > 0) parts.push(`${rest} ${rest === 1 ? t('mo') : t('mos')}`)
    return parts.join(' ')
  }
  const monthYear = (value?: string | null) => {
    const ym = parseYearMonth(value)
    return ym ? `${t(MONTHS[ym.month - 1].slice(0, 3))} ${ym.year}` : ''
  }
  const roleRange = (e: ProfileExperience) =>
    `${monthYear(e.startDate)} - ${e.isCurrent || !e.endDate ? t('Present') : monthYear(e.endDate)}`
  const labelOf = (label?: string) => (label ? t(label) : label)
  return { t, formatDuration, roleRange, labelOf }
}

function SkillsLine({ skills }: { skills: string[] }) {
  const { t } = useTranslation()
  if (skills.length === 0) return null
  const shown = skills.slice(0, MAX_SKILLS_SHOWN).join(', ')
  const extra = skills.length - MAX_SKILLS_SHOWN
  return (
    <p className='mt-2 flex items-start gap-2 text-sm font-semibold'>
      <Gem className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
      <span>
        {shown}
        {extra > 0 &&
          `, +${extra} ${extra === 1 ? t('skill') : t('skills')}`}
      </span>
    </p>
  )
}

// The square a company logo would fill; there is no logo to show, so it holds an icon.
function CompanyMark() {
  return (
    <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground'>
      <Building2 className='h-6 w-6' />
    </div>
  )
}

function Role({
  role,
  showCompany,
  onEdit,
}: {
  role: ProfileExperience
  showCompany: boolean
  onEdit: (role: ProfileExperience) => void
}) {
  const { t, formatDuration, roleRange, labelOf } = useFormatters()
  const duration = formatDuration(
    monthsBetween(role.startDate, role.isCurrent ? null : role.endDate)
  )
  const place = [role.location, labelOf(workplaceLabel(role.workplaceType))]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className='flex items-start justify-between gap-2'>
      <div className='min-w-0'>
        <p className='font-semibold'>{role.title}</p>
        {showCompany && (
          <p className='text-sm'>
            {[role.company, labelOf(employmentLabel(role.employmentType))]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {!showCompany && employmentLabel(role.employmentType) && (
          <p className='text-sm'>
            {labelOf(employmentLabel(role.employmentType))}
          </p>
        )}
        <p className='text-sm text-muted-foreground'>
          {roleRange(role)} · {duration}
        </p>
        {showCompany && place && (
          <p className='text-sm text-muted-foreground'>{place}</p>
        )}
        {role.description && (
          <ExpandableText text={role.description} className='mt-2' />
        )}
        <SkillsLine skills={role.skills} />
      </div>
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8 shrink-0 rounded-full'
        title={t('Edit experience')}
        onClick={() => onEdit(role)}
      >
        <Pencil className='h-4 w-4' />
      </Button>
    </div>
  )
}

export function ExperienceSection({
  experiences,
  onAdd,
  onEdit,
}: {
  experiences: ProfileExperience[]
  onAdd: () => void
  onEdit: (role: ProfileExperience) => void
}) {
  const { t, formatDuration, labelOf } = useFormatters()
  const groups = groupByCompany(experiences)

  return (
    <ProfileCard
      id='section-experience'
      title={t('Experience')}
      addLabel={t('Add experience')}
      onAdd={onAdd}
    >
      {groups.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          {t('No experience yet. Add your roles so the CV Writer can use them.')}
        </p>
      )}

      <div className='divide-y'>
        {groups.map((group) =>
          group.roles.length === 1 ? (
            <div
              key={group.roles[0].id}
              className='flex gap-3 py-4 first:pt-0 last:pb-0'
            >
              <CompanyMark />
              <div className='min-w-0 flex-1'>
                <Role role={group.roles[0]} showCompany onEdit={onEdit} />
              </div>
            </div>
          ) : (
            <div
              key={group.company}
              className='flex gap-3 py-4 first:pt-0 last:pb-0'
            >
              <CompanyMark />
              <div className='min-w-0 flex-1'>
                <p className='font-semibold'>{group.company}</p>
                <p className='text-sm text-muted-foreground'>
                  {formatDuration(group.totalMonths)}
                </p>
                <p className='mb-3 text-sm text-muted-foreground'>
                  {[
                    group.roles[0].location,
                    labelOf(workplaceLabel(group.roles[0].workplaceType)),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <div className='space-y-5 border-s-2 border-muted ps-4'>
                  {group.roles.map((role) => (
                    <Role
                      key={role.id}
                      role={role}
                      showCompany={false}
                      onEdit={onEdit}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </ProfileCard>
  )
}
