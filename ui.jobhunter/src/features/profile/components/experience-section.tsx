import { Pencil, Plus } from 'lucide-react'
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

const MAX_SKILLS_SHOWN = 2

function SkillsLine({ skills }: { skills: string[] }) {
  if (skills.length === 0) return null
  const shown = skills.slice(0, MAX_SKILLS_SHOWN).join(', ')
  const extra = skills.length - MAX_SKILLS_SHOWN
  return (
    <p className='mt-2 text-sm'>
      <span className='font-semibold'>Skills: </span>
      {shown}
      {extra > 0 && `, +${extra} ${extra === 1 ? 'skill' : 'skills'}`}
    </p>
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
          <p className='mt-2 text-sm whitespace-pre-line'>{role.description}</p>
        )}
        <SkillsLine skills={role.skills} />
      </div>
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8 shrink-0'
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
    <section className='rounded-md border p-5'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>Experience</h2>
        <Button
          variant='ghost'
          size='icon'
          title='Add experience'
          onClick={onAdd}
        >
          <Plus className='h-5 w-5' />
        </Button>
      </div>

      {groups.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          No experience yet. Add your roles so the CV Writer can use them.
        </p>
      )}

      <div className='divide-y'>
        {groups.map((group) =>
          group.roles.length === 1 ? (
            <div key={group.roles[0].id} className='py-4 first:pt-0 last:pb-0'>
              <Role role={group.roles[0]} showCompany onEdit={onEdit} />
            </div>
          ) : (
            <div key={group.company} className='py-4 first:pt-0 last:pb-0'>
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
              <div className='space-y-5 border-l-2 border-muted pl-4'>
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
          )
        )}
      </div>
    </section>
  )
}
