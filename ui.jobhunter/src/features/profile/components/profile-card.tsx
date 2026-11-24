import { type ReactNode } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const add = addLabel ?? t('Add {{title}}', { title: t(title).toLowerCase() })
  const edit =
    editLabel ?? t('Edit {{title}}', { title: t(title).toLowerCase() })
  return (
    <section
      id={id}
      className='scroll-mt-20 rounded-lg border bg-card p-5 text-card-foreground shadow-xs sm:p-6'
    >
      <div className='mb-4 flex items-center justify-between gap-2'>
        <h2 className='text-xl font-semibold'>{t(title)}</h2>
        <div className='flex items-center'>
          {onAdd && (
            <Button
              variant='ghost'
              size='icon'
              className='rounded-full'
              title={add}
              aria-label={add}
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
              title={edit}
              aria-label={edit}
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
