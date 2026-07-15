import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { companiesApi } from '@/features/companies/api'
import { contactsApi } from '@/features/contacts/api'
import { jobRolesApi } from '@/features/job-roles/api'
import { EntityCombobox, type EntityOption } from '@/components/entity-combobox'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PRIORITIES, STATUSES, formatStatusLabel } from '../data/constants'
import type { CreateApplicationDto, JobApplication } from '../api'

interface ScalarFields {
  status?: string
  priority?: string
  appliedDate?: string
  nextFollowUpDate?: string
  expectedSalary?: number
  currency?: string
  resumeVersion?: string
  coverLetterVersion?: string
  notes?: string
}

interface ApplicationsMutateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: JobApplication | null
  candidateId?: number
  isPending: boolean
  onSubmit: (dto: CreateApplicationDto) => void
}

export function ApplicationsMutateDialog({
  open,
  onOpenChange,
  currentRow,
  candidateId,
  isPending,
  onSubmit,
}: ApplicationsMutateDialogProps) {
  const isUpdate = !!currentRow
  const { register, handleSubmit } = useForm<ScalarFields>({
    defaultValues: currentRow
      ? {
          status: currentRow.status,
          priority: currentRow.priority,
          appliedDate: currentRow.appliedDate?.split('T')[0],
          nextFollowUpDate: currentRow.nextFollowUpDate?.split('T')[0],
          expectedSalary: currentRow.expectedSalary,
          currency: currentRow.currency,
          resumeVersion: currentRow.resumeVersion,
          coverLetterVersion: currentRow.coverLetterVersion,
          notes: currentRow.notes,
        }
      : {},
  })

  const [company, setCompany] = useState<EntityOption | null>(
    currentRow ? { value: currentRow.companyId, label: currentRow.companyName ?? `#${currentRow.companyId}` } : null
  )
  const [jobRole, setJobRole] = useState<EntityOption | null>(
    currentRow ? { value: currentRow.jobRoleId, label: currentRow.jobRoleTitle ?? `#${currentRow.jobRoleId}` } : null
  )
  const [mainContact, setMainContact] = useState<EntityOption | null>(
    currentRow?.mainContactId
      ? { value: currentRow.mainContactId, label: currentRow.mainContactName ?? `#${currentRow.mainContactId}` }
      : null
  )

  function handleCompanyChange(option: EntityOption | null) {
    setCompany(option)
    setJobRole(null)
    setMainContact(null)
  }

  function submit(scalar: ScalarFields) {
    if (!candidateId) {
      toast.error('Could not determine your candidate profile.')
      return
    }
    if (!company) {
      toast.error('Please select a company.')
      return
    }
    if (!jobRole) {
      toast.error('Please select a job role.')
      return
    }
    onSubmit({
      ...scalar,
      appliedDate: scalar.appliedDate || undefined,
      nextFollowUpDate: scalar.nextFollowUpDate || undefined,
      candidateId,
      companyId: company.value,
      jobRoleId: jobRole.value,
      mainContactId: mainContact?.value,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isUpdate ? 'Edit Application' : 'Add Application'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className='space-y-4' id='application-form'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <Label>Company *</Label>
              <EntityCombobox
                value={company}
                onChange={handleCompanyChange}
                queryKey={['companies', 'combobox']}
                placeholder='Select company...'
                searchPlaceholder='Search companies...'
                createLabel={(name) => `Create company "${name}"`}
                fetchOptions={(search) =>
                  companiesApi
                    .list({ search: search || undefined, pageSize: 20 })
                    .then((r) => r.items.map((c) => ({ value: c.id, label: c.name })))
                }
                onCreate={(name) => companiesApi.create({ name }).then((id) => ({ value: id, label: name }))}
              />
            </div>
            <div className='space-y-1'>
              <Label>Job Role *</Label>
              <EntityCombobox
                value={jobRole}
                onChange={setJobRole}
                queryKey={['job-roles', 'combobox', company?.value]}
                placeholder='Select job role...'
                searchPlaceholder='Search job roles...'
                createLabel={(name) => `Create job role "${name}"`}
                disabled={!company}
                disabledPlaceholder='Select a company first'
                fetchOptions={(search) =>
                  jobRolesApi
                    .list({ search: search || undefined, companyId: company?.value, pageSize: 20 })
                    .then((r) => r.items.map((jr) => ({ value: jr.id, label: jr.title })))
                }
                onCreate={(title) =>
                  jobRolesApi.create({ companyId: company!.value, title }).then((id) => ({ value: id, label: title }))
                }
              />
            </div>
            <div className='space-y-1'>
              <Label>Main Contact</Label>
              <EntityCombobox
                value={mainContact}
                onChange={setMainContact}
                queryKey={['contacts', 'combobox', company?.value]}
                placeholder='Select contact...'
                searchPlaceholder='Search contacts...'
                createLabel={(name) => `Create contact "${name}"`}
                disabled={!company}
                disabledPlaceholder='Select a company first'
                fetchOptions={(search) =>
                  contactsApi
                    .list({ search: search || undefined, companyId: company?.value, pageSize: 20 })
                    .then((r) => r.items.map((c) => ({ value: c.id, label: c.fullName })))
                }
                onCreate={(fullName) =>
                  contactsApi.create({ companyId: company!.value, fullName }).then((id) => ({ value: id, label: fullName }))
                }
              />
            </div>
            <div className='space-y-1'>
              <Label>Status</Label>
              <select {...register('status')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm'>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {formatStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <div className='space-y-1'>
              <Label>Priority</Label>
              <select {...register('priority')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm'>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className='space-y-1'>
              <Label>Applied Date</Label>
              <Input type='date' {...register('appliedDate')} />
            </div>
            <div className='space-y-1'>
              <Label>Next Follow-Up</Label>
              <Input type='date' {...register('nextFollowUpDate')} />
            </div>
            <div className='space-y-1'>
              <Label>Expected Salary</Label>
              <Input type='number' {...register('expectedSalary', { valueAsNumber: true })} />
            </div>
            <div className='space-y-1'>
              <Label>Currency</Label>
              <Input {...register('currency')} placeholder='USD' />
            </div>
            <div className='space-y-1'>
              <Label>Resume Version</Label>
              <Input {...register('resumeVersion')} placeholder='v1, tailored-stripe' />
            </div>
            <div className='space-y-1'>
              <Label>Cover Letter Version</Label>
              <Input {...register('coverLetterVersion')} />
            </div>
          </div>
          <div className='space-y-1'>
            <Label>Notes</Label>
            <Textarea {...register('notes')} rows={3} />
          </div>
        </form>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='application-form' disabled={isPending}>
            {isUpdate ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
