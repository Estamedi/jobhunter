import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Building2,
  CalendarIcon,
  Download,
  FileText,
  Loader2,
  StickyNote,
  Wallet,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { companiesApi } from '@/features/companies/api'
import { contactsApi } from '@/features/contacts/api'
import { jobRolesApi } from '@/features/job-roles/api'
import { cvsApi } from '@/features/cvs/api'
import { downloadCvFile } from '@/features/cvs/lib/cv-file'
import { EntityCombobox, type EntityOption } from '@/components/entity-combobox'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { CURRENCIES, PRIORITIES, STATUSES, formatStatusLabel } from '../data/constants'
import type { CreateApplicationDto, JobApplication } from '../api'

function SectionHeading({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className='flex items-center gap-2'>
      <Icon className='h-4 w-4 text-muted-foreground' />
      <h4 className='text-sm font-medium'>{title}</h4>
    </div>
  )
}

function OrDivider({ label }: { label: string }) {
  return (
    <div className='relative'>
      <div className='absolute inset-0 flex items-center'>
        <span className='w-full border-t' />
      </div>
      <div className='relative flex justify-center text-xs uppercase'>
        <span className='bg-background px-2 text-muted-foreground'>{label}</span>
      </div>
    </div>
  )
}

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

function DatePickerField({
  value,
  onChange,
  placeholder,
}: {
  value?: string
  onChange: (value: string | undefined) => void
  placeholder: string
}) {
  const selected = value ? new Date(`${value}T00:00:00`) : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className={cn('w-full justify-start text-left font-normal', !selected && 'text-muted-foreground')}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {selected ? format(selected, 'PPP') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          selected={selected}
          onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : undefined)}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
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
  const { register, handleSubmit, control } = useForm<ScalarFields>({
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
      : { currency: 'USD', status: STATUSES[0], priority: PRIORITIES[0] },
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
  const [resumeCv, setResumeCv] = useState<EntityOption | null>(
    currentRow?.cvId ? { value: currentRow.cvId, label: currentRow.cvFileName ?? `#${currentRow.cvId}` } : null
  )
  const { data: jobRoleDetail } = useQuery({
    queryKey: ['job-roles', 'detail', jobRole?.value],
    queryFn: () => jobRolesApi.get(jobRole!.value),
    enabled: !!jobRole,
  })
  const jobRoleDescription = jobRoleDetail?.description ?? (jobRole?.value === currentRow?.jobRoleId ? currentRow?.jobRoleDescription : undefined)

  const [newResumeFile, setNewResumeFile] = useState<File | null>(null)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  function handleCompanyChange(option: EntityOption | null) {
    setCompany(option)
    setJobRole(null)
    setMainContact(null)
  }

  function handleResumeSelect(option: EntityOption | null) {
    setResumeCv(option)
    setNewResumeFile(null)
    setFileInputKey((k) => k + 1)
  }

  function handleResumeFileChange(file: File | null) {
    setNewResumeFile(file)
    if (file) setResumeCv(null)
  }

  async function submit(scalar: ScalarFields) {
    if (!candidateId) {
      toast.error('Could not determine your candidate profile.')
      return
    }
    if (!company) {
      toast.error('Please select a company.')
      return
    }
    if (!jobRole) {
      toast.error('Please select a vacancy.')
      return
    }

    let cvId = resumeCv?.value
    if (newResumeFile) {
      setIsUploadingResume(true)
      try {
        cvId = await cvsApi.upload({ candidateId, file: newResumeFile })
      } catch {
        toast.error('Failed to upload resume')
        setIsUploadingResume(false)
        return
      }
      setIsUploadingResume(false)
    }

    onSubmit({
      ...scalar,
      appliedDate: scalar.appliedDate || undefined,
      nextFollowUpDate: scalar.nextFollowUpDate || undefined,
      candidateId,
      companyId: company.value,
      jobRoleId: jobRole.value,
      mainContactId: mainContact?.value,
      cvId,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isUpdate ? 'Edit Application' : 'Add Application'}</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? 'Update the vacancy, pipeline stage, and documents for this application.'
              : "Track a vacancy you applied to — who it's with, where it stands, and the resume you sent."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className='space-y-5' id='application-form'>
          <section className='space-y-3'>
            <SectionHeading icon={Building2} title='Vacancy' />
            <div className='grid grid-cols-2 gap-3'>
              <div className='min-w-0 space-y-1'>
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
              <div className='min-w-0 space-y-1'>
                <Label>Vacancy *</Label>
                <EntityCombobox
                  value={jobRole}
                  onChange={setJobRole}
                  queryKey={['job-roles', 'combobox', company?.value]}
                  placeholder='Select vacancy...'
                  searchPlaceholder='Search vacancies...'
                  createLabel={(name) => `Create vacancy "${name}"`}
                  disabled={!company}
                  disabledPlaceholder='Select a company first'
                  fetchOptions={(search) =>
                    jobRolesApi
                      .list({ search: search || undefined, companyId: company?.value, pageSize: 20 })
                      .then((r) => r.items.map((jr) => ({ value: jr.id, label: jr.title })))
                  }
                  onCreate={(title) =>
                    jobRolesApi
                      .create({ companyId: company!.value, title })
                      .then((id) => ({ value: id, label: title }))
                  }
                />
              </div>
              {jobRole && (
                <div className='min-w-0 space-y-1 col-span-2'>
                  <Label>Job Description</Label>
                  <Textarea
                    value={jobRoleDescription ?? ''}
                    readOnly
                    rows={3}
                    placeholder='No description on file for this vacancy yet — add one from the Vacancies page.'
                    className='resize-none bg-muted/40'
                  />
                </div>
              )}
              <div className='min-w-0 space-y-1 col-span-2'>
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
                    contactsApi
                      .create({ companyId: company!.value, fullName })
                      .then((id) => ({ value: id, label: fullName }))
                  }
                />
              </div>
            </div>
          </section>

          <Separator />

          <section className='space-y-3'>
            <SectionHeading icon={Workflow} title='Pipeline' />
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Status</Label>
                <Controller
                  control={control}
                  name='status'
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select status...' />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {formatStatusLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className='space-y-1'>
                <Label>Priority</Label>
                <Controller
                  control={control}
                  name='priority'
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select priority...' />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className='space-y-1'>
                <Label>Applied Date</Label>
                <Controller
                  control={control}
                  name='appliedDate'
                  render={({ field }) => (
                    <DatePickerField value={field.value} onChange={field.onChange} placeholder='Pick a date' />
                  )}
                />
              </div>
              <div className='space-y-1'>
                <Label>Next Follow-Up</Label>
                <Controller
                  control={control}
                  name='nextFollowUpDate'
                  render={({ field }) => (
                    <DatePickerField value={field.value} onChange={field.onChange} placeholder='Pick a date' />
                  )}
                />
              </div>
            </div>
          </section>

          <Separator />

          <section className='space-y-3'>
            <SectionHeading icon={Wallet} title='Compensation' />
            <div className='grid grid-cols-3 gap-3'>
              <div className='space-y-1 col-span-2'>
                <Label>Expected Salary</Label>
                <Input type='number' placeholder='e.g. 120000' {...register('expectedSalary', { valueAsNumber: true })} />
              </div>
              <div className='space-y-1'>
                <Label>Currency</Label>
                <Controller
                  control={control}
                  name='currency'
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Currency' />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </section>

          <Separator />

          <section className='space-y-3'>
            <SectionHeading icon={FileText} title='Documents' />
            <div className='space-y-1'>
              <Label>Resume</Label>
              <div className='space-y-2 rounded-md border p-3'>
                <div className='flex items-center gap-2'>
                  <div className='min-w-0 flex-1'>
                    <EntityCombobox
                      value={resumeCv}
                      onChange={handleResumeSelect}
                      queryKey={['cvs', 'combobox', candidateId]}
                      placeholder='Select existing resume...'
                      searchPlaceholder='Search your resumes...'
                      disabled={!candidateId}
                      disabledPlaceholder='Loading your profile...'
                      fetchOptions={(search) =>
                        cvsApi.list({ candidateId, pageSize: 100 }).then((r) =>
                          r.items
                            .filter((cv) => !search || cv.fileName.toLowerCase().includes(search.toLowerCase()))
                            .map((cv) => ({ value: cv.id, label: cv.fileName }))
                        )
                      }
                    />
                  </div>
                  {resumeCv && (
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      title='Download resume'
                      onClick={() => downloadCvFile({ id: resumeCv.value, fileName: resumeCv.label })}
                    >
                      <Download className='h-4 w-4' />
                    </Button>
                  )}
                </div>
                <OrDivider label='Or upload new' />
                <div className='flex items-center gap-2'>
                  <Input
                    key={fileInputKey}
                    type='file'
                    accept='.pdf,.doc,.docx'
                    className='text-sm'
                    onChange={(e) => handleResumeFileChange(e.target.files?.[0] ?? null)}
                  />
                  {isUploadingResume && <Loader2 className='h-4 w-4 animate-spin shrink-0' />}
                </div>
              </div>
            </div>
            <div className='space-y-1'>
              <Label>Resume Version</Label>
              <Input {...register('resumeVersion')} placeholder='v1, tailored-stripe' />
            </div>
          </section>

          <Separator />

          <section className='space-y-3'>
            <SectionHeading icon={StickyNote} title='Notes' />
            <Textarea
              {...register('notes')}
              rows={3}
              placeholder='Interview prep, referral details, anything worth remembering...'
            />
          </section>
        </form>
        <DialogFooter>
          <div className='flex w-full items-center justify-between gap-2'>
            <span className='text-xs text-muted-foreground'>* Required</span>
            <div className='flex gap-2'>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' form='application-form' disabled={isPending || isUploadingResume}>
                {isUpdate ? 'Save Changes' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
