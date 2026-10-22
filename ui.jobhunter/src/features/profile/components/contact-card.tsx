import { useState } from 'react'
import { Mail, MapPin, Pencil, Phone } from 'lucide-react'
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
          <Label htmlFor='contact-name'>Full name*</Label>
          <Input
            id='contact-name'
            required
            maxLength={200}
            value={values.fullName}
            onChange={(e) => set('fullName', e.target.value)}
          />
        </div>
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
      </form>
      <DialogFooter>
        <Button variant='outline' onClick={onClose}>
          Cancel
        </Button>
        <Button
          type='submit'
          form='contact-form'
          disabled={isSaving || !values.fullName.trim() || !values.email.trim()}
        >
          Save
        </Button>
      </DialogFooter>
    </>
  )
}

export function ContactCard({
  values,
  isSaving,
  onSave,
}: {
  values: ContactValues
  isSaving: boolean
  onSave: (values: ContactValues, done: () => void) => void
}) {
  const [open, setOpen] = useState(false)
  const missing = [
    !values.phone && 'phone',
    !values.currentLocation && 'location',
  ].filter(Boolean)

  return (
    <section className='rounded-md border p-5'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>Contact info</h2>
        <Button
          variant='ghost'
          size='icon'
          title='Edit contact info'
          onClick={() => setOpen(true)}
        >
          <Pencil className='h-4 w-4' />
        </Button>
      </div>

      <div className='space-y-1 text-sm'>
        <p className='flex items-center gap-2'>
          <Mail className='h-4 w-4 text-muted-foreground' /> {values.email}
        </p>
        <p className='flex items-center gap-2'>
          <Phone className='h-4 w-4 text-muted-foreground' />
          {values.phone || (
            <span className='text-muted-foreground'>No phone yet</span>
          )}
        </p>
        <p className='flex items-center gap-2'>
          <MapPin className='h-4 w-4 text-muted-foreground' />
          {values.currentLocation || (
            <span className='text-muted-foreground'>No location yet</span>
          )}
        </p>
      </div>

      <p className='mt-3 text-xs text-muted-foreground'>
        {missing.length > 0
          ? `Add your ${missing.join(' and ')} so it appears in your CV header.`
          : 'These appear in your CV header.'}
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Edit contact info</DialogTitle>
            <DialogDescription>
              These details appear at the top of your CV.
            </DialogDescription>
          </DialogHeader>
          {open && (
            <ContactForm
              initial={values}
              isSaving={isSaving}
              onSave={(v) => onSave(v, () => setOpen(false))}
              onClose={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
