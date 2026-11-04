import { GraduationCap, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type ProfileEducation } from '../api'
import { educationRange } from '../lib/experience'
import { ExpandableText } from './expandable-text'
import { ProfileCard } from './profile-card'

export function EducationSection({
  educations,
  onAdd,
  onEdit,
}: {
  educations: ProfileEducation[]
  onAdd: () => void
  onEdit: (education: ProfileEducation) => void
}) {
  return (
    <ProfileCard
      id='section-education'
      title='Education'
      addLabel='Add education'
      onAdd={onAdd}
    >
      {educations.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          No education yet. Add your degrees and schools.
        </p>
      )}

      <div className='divide-y'>
        {educations.map((e) => {
          const subject = [e.degree, e.fieldOfStudy].filter(Boolean).join(', ')
          const dates = educationRange(e.startDate, e.endDate)
          return (
            <div
              key={e.id}
              className='flex items-start gap-3 py-4 first:pt-0 last:pb-0'
            >
              <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground'>
                <GraduationCap className='h-6 w-6' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='font-semibold'>{e.institution}</p>
                <p className='text-sm'>{subject}</p>
                {dates && (
                  <p className='text-sm text-muted-foreground'>{dates}</p>
                )}
                {e.details && (
                  <ExpandableText text={e.details} className='mt-2' />
                )}
              </div>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 shrink-0 rounded-full'
                title='Edit education'
                onClick={() => onEdit(e)}
              >
                <Pencil className='h-4 w-4' />
              </Button>
            </div>
          )
        })}
      </div>
    </ProfileCard>
  )
}
