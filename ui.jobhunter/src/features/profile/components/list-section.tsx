import { useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FieldDialog, type FieldDef, type FieldValues } from './field-dialog'
import { ProfileCard } from './profile-card'

// A profile section that is a simple list of items edited through a field dialog.
export function ListSection<T extends { id: number }, Dto>({
  title,
  itemLabel,
  emptyText,
  candidateId,
  items,
  fields,
  render,
  toValues,
  toDto,
  api,
  openAddSignal = 0,
}: {
  title: string
  itemLabel: string
  emptyText: string
  candidateId: number
  items: T[]
  fields: FieldDef[]
  render: (item: T) => ReactNode
  toValues: (item: T) => FieldValues
  toDto: (values: FieldValues, item: T | null) => Dto
  api: {
    add: (candidateId: number, dto: Dto) => Promise<unknown>
    update: (id: number, dto: Dto) => Promise<unknown>
    remove: (id: number) => Promise<unknown>
  }
  // Goes up when the page asks for the "add" dialog to open (the header's Add section menu).
  openAddSignal?: number
}) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const item_ = t(itemLabel)
  // `undefined` = closed, `null` = adding, otherwise editing that item.
  const [editing, setEditing] = useState<T | null | undefined>(undefined)
  // Opens the "add" dialog when the page's signal goes up. Done while rendering, which is how React
  // wants state adjusted from a changed prop; an effect would render once with the old state first.
  const [seenSignal, setSeenSignal] = useState(openAddSignal)
  if (seenSignal !== openAddSignal) {
    setSeenSignal(openAddSignal)
    setEditing(null)
  }

  const done = (message: string) => {
    qc.invalidateQueries({ queryKey: ['profile'] })
    setEditing(undefined)
    toast.success(message)
  }

  const save = useMutation({
    mutationFn: (values: FieldValues) =>
      editing
        ? api.update(editing.id, toDto(values, editing))
        : api.add(candidateId, toDto(values, null)),
    onSuccess: () => done(t('{{title}} saved', { title: t(title) })),
    onError: () => toast.error(t('Failed to save {{item}}', { item: item_ })),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: () => done(t('{{title}} removed', { title: t(title) })),
    onError: () =>
      toast.error(t('Failed to delete {{item}}', { item: item_ })),
  })

  return (
    <ProfileCard
      id={`section-${title.toLowerCase()}`}
      title={t(title)}
      addLabel={t('Add {{item}}', { item: item_ })}
      onAdd={() => setEditing(null)}
    >
      {items.length === 0 && (
        <p className='text-sm text-muted-foreground'>{t(emptyText)}</p>
      )}

      <div className='divide-y'>
        {items.map((item) => (
          <div
            key={item.id}
            className='flex items-start justify-between gap-2 py-3 first:pt-0 last:pb-0'
          >
            <div className='min-w-0 text-sm'>{render(item)}</div>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 shrink-0 rounded-full'
              title={t('Edit {{item}}', { item: item_ })}
              onClick={() => setEditing(item)}
            >
              <Pencil className='h-4 w-4' />
            </Button>
          </div>
        ))}
      </div>

      {editing !== undefined && (
        <FieldDialog
          key={editing?.id ?? 'new'}
          title={
            editing
              ? t('Edit {{item}}', { item: item_ })
              : t('Add {{item}}', { item: item_ })
          }
          fields={fields}
          initial={editing ? toValues(editing) : null}
          isSaving={save.isPending}
          isDeleting={remove.isPending}
          onOpenChange={(open) => !open && setEditing(undefined)}
          onSave={(values) => save.mutate(values)}
          onDelete={() => editing && remove.mutate(editing.id)}
        />
      )}
    </ProfileCard>
  )
}
