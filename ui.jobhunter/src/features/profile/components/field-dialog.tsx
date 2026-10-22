import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { YEARS } from '../lib/experience'

export interface FieldDef {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'year'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
}

export type FieldValues = Record<string, string>

const NONE = '__none__'

// A small add/edit form driven by a field list, used by the simple profile sections.
export function FieldDialog({
  title,
  fields,
  initial,
  isSaving,
  isDeleting,
  onOpenChange,
  onSave,
  onDelete,
}: {
  title: string
  fields: FieldDef[]
  initial: FieldValues | null
  isSaving: boolean
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: FieldValues) => void
  onDelete: () => void
}) {
  const [values, setValues] = useState<FieldValues>(initial ?? {})
  const set = (name: string, value: string) =>
    setValues((v) => ({ ...v, [name]: value }))

  const canSave = fields.every((f) => !f.required || !!values[f.name]?.trim())

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-lg overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form
          id='field-form'
          className='space-y-4'
          onSubmit={(e) => {
            e.preventDefault()
            if (canSave) onSave(values)
          }}
        >
          {fields.map((f) => (
            <div key={f.name} className='space-y-1'>
              <Label htmlFor={`field-${f.name}`}>
                {f.label}
                {f.required && '*'}
              </Label>
              {f.type === 'text' && (
                <Input
                  id={`field-${f.name}`}
                  required={f.required}
                  value={values[f.name] ?? ''}
                  onChange={(e) => set(f.name, e.target.value)}
                  placeholder={f.placeholder}
                />
              )}
              {f.type === 'textarea' && (
                <Textarea
                  id={`field-${f.name}`}
                  rows={4}
                  maxLength={2000}
                  value={values[f.name] ?? ''}
                  onChange={(e) => set(f.name, e.target.value)}
                  placeholder={f.placeholder}
                />
              )}
              {f.type === 'select' && (
                <Select
                  value={values[f.name] || NONE}
                  onValueChange={(v) => set(f.name, v === NONE ? '' : v)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Please select' />
                  </SelectTrigger>
                  <SelectContent>
                    {!f.required && (
                      <SelectItem value={NONE}>Please select</SelectItem>
                    )}
                    {f.options?.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {f.type === 'year' && (
                <Select
                  value={values[f.name] || NONE}
                  onValueChange={(v) => set(f.name, v === NONE ? '' : v)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Year' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Year</SelectItem>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </form>

        <DialogFooter className='sm:justify-between'>
          {initial ? (
            <Button
              type='button'
              variant='ghost'
              className='text-destructive'
              disabled={isDeleting}
              onClick={onDelete}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}
          <Button
            type='submit'
            form='field-form'
            disabled={!canSave || isSaving}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
