import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface ContactValues {
  fullName: string
  email: string
  phone: string
  currentLocation: string
  availability: string
}

function ContactForm({
  initial,
  isSaving,
  onSave,
  onClose,
}: {
  initial: ContactValues
  isSaving: boolean
  onSave: (values: ContactValues) => void
  onClose: () => void
}) {
  const [values, setValues] = useState(initial)
  const set = (key: keyof ContactValues, value: string) =>
    setValues((v) => ({ ...v, [key]: value }))

  return (
    <>
      <form
        id='contact-form'
        className='space-y-4'
        onSubmit={(e) => {
          e.preventDefault()
          onSave(values)
        }}
      >
        <div className='space-y-1'>
          <Label htmlFor='contact-email'>Email*</Label>
          <Input
            id='contact-email'
            type='email'
            required
            maxLength={200}
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
          />
        </div>
        <div className='space-y-1'>
          <Label htmlFor='contact-phone'>Phone</Label>
          <Input
            id='contact-phone'
            maxLength={50}
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder='Ex: (+968) 9221 8568'
          />
        </div>
        <div className='space-y-1'>
          <Label htmlFor='contact-location'>Location</Label>
          <Input
            id='contact-location'
            maxLength={200}
            value={values.currentLocation}
            onChange={(e) => set('currentLocation', e.target.value)}
            placeholder='Ex: Muscat, Oman'
          />
        </div>
        <div className='space-y-1'>
          <Label htmlFor='contact-availability'>Availability</Label>
          <Input
            id='contact-availability'
            maxLength={60}
            value={values.availability}
            onChange={(e) => set('availability', e.target.value)}
            placeholder='Ex: Immediately, or 1 month notice'
          />
          <p className='text-xs text-muted-foreground'>
            Shown on the &ldquo;With photo&rdquo; CV template.
          </p>
        </div>
      </form>
      <DialogFooter>
        <Button variant='outline' onClick={onClose}>
          Cancel
        </Button>
        <Button
          type='submit'
          form='contact-form'
          disabled={isSaving || !values.email.trim()}
        >
          Save
        </Button>
      </DialogFooter>
    </>
  )
}

// "Contact info", opened from the header like on LinkedIn: the details that appear in a CV header.
export function ContactDialog({
  open,
  onOpenChange,
  values,
  isSaving,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  values: ContactValues
  isSaving: boolean
  onSave: (values: ContactValues) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Contact info</DialogTitle>
          <DialogDescription>
            These details appear at the top of your CV.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ContactForm
            initial={values}
            isSaving={isSaving}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
