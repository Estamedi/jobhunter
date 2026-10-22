import { Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type ProfileEducation } from '../api'
import { educationRange } from '../lib/experience'

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
    <section className='rounded-md border p-5'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>Education</h2>
        <Button
          variant='ghost'
          size='icon'
          title='Add education'
          onClick={onAdd}
        >
          <Plus className='h-5 w-5' />
        </Button>
      </div>

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
              className='flex items-start justify-between gap-2 py-4 first:pt-0 last:pb-0'
            >
              <div className='min-w-0'>
                <p className='font-semibold'>{e.institution}</p>
                <p className='text-sm'>{subject}</p>
                {dates && (
                  <p className='text-sm text-muted-foreground'>{dates}</p>
                )}
                {e.details && (
                  <p className='mt-2 text-sm whitespace-pre-line'>
                    {e.details}
                  </p>
                )}
              </div>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 shrink-0'
                title='Edit education'
                onClick={() => onEdit(e)}
              >
                <Pencil className='h-4 w-4' />
              </Button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
