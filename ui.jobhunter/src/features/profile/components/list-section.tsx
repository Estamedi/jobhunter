import { useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FieldDialog, type FieldDef, type FieldValues } from './field-dialog'

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
}) {
  const qc = useQueryClient()
  // `undefined` = closed, `null` = adding, otherwise editing that item.
  const [editing, setEditing] = useState<T | null | undefined>(undefined)

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
    onSuccess: () => done(`${title} saved`),
    onError: () => toast.error(`Failed to save ${itemLabel}`),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: () => done(`${title} removed`),
    onError: () => toast.error(`Failed to delete ${itemLabel}`),
  })

  return (
    <section className='rounded-md border p-5'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>{title}</h2>
        <Button
          variant='ghost'
          size='icon'
          title={`Add ${itemLabel}`}
          onClick={() => setEditing(null)}
        >
          <Plus className='h-5 w-5' />
        </Button>
      </div>

      {items.length === 0 && (
        <p className='text-sm text-muted-foreground'>{emptyText}</p>
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
              className='h-8 w-8 shrink-0'
              title={`Edit ${itemLabel}`}
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
          title={editing ? `Edit ${itemLabel}` : `Add ${itemLabel}`}
          fields={fields}
          initial={editing ? toValues(editing) : null}
          isSaving={save.isPending}
          isDeleting={remove.isPending}
          onOpenChange={(open) => !open && setEditing(undefined)}
          onSave={(values) => save.mutate(values)}
          onDelete={() => editing && remove.mutate(editing.id)}
        />
      )}
    </section>
  )
}
