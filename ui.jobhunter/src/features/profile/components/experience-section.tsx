import { Building2, Gem, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type ProfileExperience } from '../api'
import {
  employmentLabel,
  formatDuration,
  groupByCompany,
  monthsBetween,
  roleRange,
  workplaceLabel,
} from '../lib/experience'
import { ExpandableText } from './expandable-text'
import { ProfileCard } from './profile-card'

const MAX_SKILLS_SHOWN = 2

function SkillsLine({ skills }: { skills: string[] }) {
  if (skills.length === 0) return null
  const shown = skills.slice(0, MAX_SKILLS_SHOWN).join(', ')
  const extra = skills.length - MAX_SKILLS_SHOWN
  return (
    <p className='mt-2 flex items-start gap-2 text-sm font-semibold'>
      <Gem className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
      <span>
        {shown}
        {extra > 0 && `, +${extra} ${extra === 1 ? 'skill' : 'skills'}`}
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
  const duration = formatDuration(
    monthsBetween(role.startDate, role.isCurrent ? null : role.endDate)
  )
  const place = [role.location, workplaceLabel(role.workplaceType)]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className='flex items-start justify-between gap-2'>
      <div className='min-w-0'>
        <p className='font-semibold'>{role.title}</p>
        {showCompany && (
          <p className='text-sm'>
            {[role.company, employmentLabel(role.employmentType)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {!showCompany && employmentLabel(role.employmentType) && (
          <p className='text-sm'>{employmentLabel(role.employmentType)}</p>
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
        title='Edit experience'
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
  const groups = groupByCompany(experiences)

  return (
    <ProfileCard
      id='section-experience'
      title='Experience'
      addLabel='Add experience'
      onAdd={onAdd}
    >
      {groups.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          No experience yet. Add your roles so the CV Writer can use them.
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
                    workplaceLabel(group.roles[0].workplaceType),
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
