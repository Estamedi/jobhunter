import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { contactsApi, type JobContact } from '@/features/contacts/api'
import { EntityCombobox, type EntityOption } from '@/components/entity-combobox'
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
import { applicationsApi, type JobApplication } from '../api'

interface EditableContact {
  id: number
  companyId: number
  type: string
  warmth: string
  notes?: string
}

interface ApplicationMainContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  application: JobApplication
  contact?: JobContact
}

export function ApplicationMainContactDialog({
  open,
  onOpenChange,
  application,
  contact,
}: ApplicationMainContactDialogProps) {
  const qc = useQueryClient()

  const [selected, setSelected] = useState<EntityOption | null>(
    contact ? { value: contact.id, label: contact.fullName } : null
  )
  const [justCreated, setJustCreated] = useState<EditableContact | null>(null)
  const [fullName, setFullName] = useState(contact?.fullName ?? '')
  const [jobTitle, setJobTitle] = useState(contact?.jobTitle ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [linkedInUrl, setLinkedInUrl] = useState(contact?.linkedInUrl ?? '')

  const editableSource: EditableContact | undefined =
    selected && contact && selected.value === contact.id
      ? { id: contact.id, companyId: contact.companyId ?? application.companyId, type: contact.type, warmth: contact.warmth, notes: contact.notes }
      : selected && justCreated && selected.value === justCreated.id
        ? justCreated
        : undefined

  function handleSelect(option: EntityOption | null) {
    setSelected(option)
    if (option && contact && option.value === contact.id) {
      setFullName(contact.fullName)
      setJobTitle(contact.jobTitle ?? '')
      setEmail(contact.email ?? '')
      setPhone(contact.phone ?? '')
      setLinkedInUrl(contact.linkedInUrl ?? '')
    }
  }

  async function handleCreate(name: string) {
    const id = await contactsApi.create({ companyId: application.companyId, fullName: name })
    setJustCreated({ id, companyId: application.companyId, type: 'Other', warmth: 'Cold' })
    setFullName(name)
    setJobTitle('')
    setEmail('')
    setPhone('')
    setLinkedInUrl('')
    return { value: id, label: name }
  }

  const save = useMutation({
    mutationFn: async () => {
      if (editableSource) {
        const trimmedName = fullName.trim()
        if (!trimmedName) throw new Error('missing-name')
        await contactsApi.update(editableSource.id, {
          fullName: trimmedName,
          companyId: editableSource.companyId,
          jobTitle: jobTitle.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          linkedInUrl: linkedInUrl.trim() || undefined,
          type: editableSource.type,
          warmth: editableSource.warmth,
          notes: editableSource.notes,
        })
      }

      if ((selected?.value ?? undefined) !== application.mainContactId) {
        await applicationsApi.update(application.id, {
          status: application.status,
          priority: application.priority,
          appliedDate: application.appliedDate,
          nextFollowUpDate: application.nextFollowUpDate,
          resumeVersion: application.resumeVersion,
          coverLetterVersion: application.coverLetterVersion,
          expectedSalary: application.expectedSalary,
          actualOfferSalary: application.actualOfferSalary,
          currency: application.currency,
          rejectionReason: application.rejectionReason,
          cvId: application.cvId,
          mainContactId: selected?.value,
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications', 'detail', application.id] })
      qc.invalidateQueries({ queryKey: ['contacts', 'detail', contact?.id] })
      qc.invalidateQueries({ queryKey: ['contacts', 'detail', selected?.value] })
      qc.invalidateQueries({ queryKey: ['applications'] })
      toast.success('Main contact updated')
      onOpenChange(false)
    },
    onError: (err) => {
      toast.error(err instanceof Error && err.message === 'missing-name' ? 'Contact name is required' : 'Failed to update main contact')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg rounded-2xl sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit main contact' : 'Add main contact'}</DialogTitle>
          <DialogDescription>Who&apos;s your point of contact for this application?</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-1'>
            <Label>Contact</Label>
            <EntityCombobox
              value={selected}
              onChange={handleSelect}
              queryKey={['contacts', 'combobox', application.companyId]}
              placeholder='Select contact...'
              searchPlaceholder='Search contacts...'
              createLabel={(name) => `Create contact "${name}"`}
              triggerClassName='rounded-xl'
              fetchOptions={(search) =>
                contactsApi
                  .list({ search: search || undefined, companyId: application.companyId, pageSize: 20 })
                  .then((r) => r.items.map((c) => ({ value: c.id, label: c.fullName })))
              }
              onCreate={handleCreate}
            />
            {selected && (
              <button
                type='button'
                className='pt-1 text-xs text-muted-foreground hover:text-foreground hover:underline'
                onClick={() => setSelected(null)}
              >
                Remove main contact
              </button>
            )}
          </div>

          {editableSource && (
            <div className='grid grid-cols-2 gap-3 rounded-xl border bg-muted/30 p-3'>
              <div className='col-span-2 space-y-1'>
                <Label>Full name *</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className='rounded-xl bg-background' />
              </div>
              <div className='col-span-2 space-y-1'>
                <Label>Job title</Label>
                <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className='rounded-xl bg-background' />
              </div>
              <div className='space-y-1'>
                <Label>Email</Label>
                <Input type='email' value={email} onChange={(e) => setEmail(e.target.value)} className='rounded-xl bg-background' />
              </div>
              <div className='space-y-1'>
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className='rounded-xl bg-background' />
              </div>
              <div className='col-span-2 space-y-1'>
                <Label>LinkedIn</Label>
                <Input value={linkedInUrl} onChange={(e) => setLinkedInUrl(e.target.value)} className='rounded-xl bg-background' />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' className='rounded-xl' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className='rounded-xl' disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending && <Loader2 className='mr-1.5 size-3.5 animate-spin' />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
