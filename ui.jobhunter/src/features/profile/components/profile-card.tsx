import { type ReactNode } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

// One section of the profile, drawn like a LinkedIn card: a title with a "+" to add and a pencil to edit.
export function ProfileCard({
  id,
  title,
  addLabel,
  onAdd,
  editLabel,
  onEdit,
  children,
}: {
  id?: string
  title: string
  addLabel?: string
  onAdd?: () => void
  editLabel?: string
  onEdit?: () => void
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className='scroll-mt-20 rounded-lg border bg-card p-5 text-card-foreground shadow-xs sm:p-6'
    >
      <div className='mb-4 flex items-center justify-between gap-2'>
        <h2 className='text-xl font-semibold'>{title}</h2>
        <div className='flex items-center'>
          {onAdd && (
            <Button
              variant='ghost'
              size='icon'
              className='rounded-full'
              title={addLabel ?? `Add ${title.toLowerCase()}`}
              aria-label={addLabel ?? `Add ${title.toLowerCase()}`}
              onClick={onAdd}
            >
              <Plus className='h-5 w-5' />
            </Button>
          )}
          {onEdit && (
            <Button
              variant='ghost'
              size='icon'
              className='rounded-full'
              title={editLabel ?? `Edit ${title.toLowerCase()}`}
              aria-label={editLabel ?? `Edit ${title.toLowerCase()}`}
              onClick={onEdit}
            >
              <Pencil className='h-4 w-4' />
            </Button>
          )}
        </div>
      </div>
      {children}
    </section>
  )
}
