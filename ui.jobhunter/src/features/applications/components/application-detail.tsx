import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNowStrict } from 'date-fns'
import {
  Briefcase,
  Building2,
  CalendarClock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  StickyNote,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { IconWhatsapp } from '@/assets/brand-icons'
import { candidatesApi } from '@/features/candidates/api'
import { companiesApi } from '@/features/companies/api'
import { contactsApi } from '@/features/contacts/api'
import { jobRolesApi } from '@/features/job-roles/api'
import { interviewsApi } from '@/features/interviews/api'
import { downloadCvFile, viewCvFile } from '@/features/cvs/lib/cv-file'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { applicationsApi, type CreateApplicationDto, type JobApplication } from '../api'
import { PRIORITIES, STAGE_ACCENTS, UNKNOWN_STAGE_ACCENT, formatStatusLabel } from '../data/constants'
import { useBoardStages } from '../hooks/use-board-stages'
import { ApplicationCompanyDialog } from './application-company-dialog'
import { ApplicationJourney } from './application-journey'
import { ApplicationMainContactDialog } from './application-main-contact-dialog'
import { ApplicationNotes } from './application-notes'
import { ApplicationVacancyDialog } from './application-vacancy-dialog'
import { ApplicationsMutateDialog } from './applications-mutate-dialog'
import { InterviewTimeline } from './interview-timeline'
import { PriorityPicker } from './pipeline-pickers'
import { SectionHeading } from './section-heading'

const FOLLOWUP_TINTS: Record<string, string> = {
  Overdue: 'border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-400',
  DueToday: 'border-orange-200 bg-orange-50/70 text-orange-700 dark:border-orange-900 dark:bg-orange-950/20 dark:text-orange-400',
  ThisWeek: 'border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-400',
}
const DEFAULT_FOLLOWUP_TINT = 'border-violet-200 bg-violet-50/70 text-violet-700 dark:border-violet-900 dark:bg-violet-950/20 dark:text-violet-400'

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border bg-card p-5', className)}>{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex items-start justify-between gap-3 text-sm'>
      <span className='shrink-0 text-muted-foreground'>{label}</span>
      <span className='text-right font-medium'>{children}</span>
    </div>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className='text-sm text-muted-foreground italic'>{children}</p>
}

function toWhatsAppUrl(phone: string) {
  return `https://wa.me/${phone.replace(/[^\d+]/g, '').replace(/^\+/, '')}`
}

function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const [canExpand, setCanExpand] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el) setCanExpand(el.scrollHeight > el.clientHeight + 1)
  }, [text])

  return (
    <div>
      <p ref={ref} className={cn('mt-1 text-sm whitespace-pre-line', !expanded && 'line-clamp-4')}>
        {text}
      </p>
      {canExpand && (
        <button
          type='button'
          className='mt-1 text-xs font-medium text-violet-600 hover:underline dark:text-violet-400'
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className='space-y-5'>
      <Skeleton className='h-8 w-40' />
      <Skeleton className='h-40 w-full rounded-2xl' />
      <div className='grid gap-5 lg:grid-cols-3'>
        <Skeleton className='h-64 rounded-2xl lg:col-span-2' />
        <Skeleton className='h-64 rounded-2xl' />
      </div>
    </div>
  )
}

interface ApplicationDetailProps {
  applicationId: number
  onClose?: () => void
}

export function ApplicationDetail({ applicationId, onClose }: ApplicationDetailProps) {
  const qc = useQueryClient()
  const { stages } = useBoardStages()
  const [editOpen, setEditOpen] = useState(false)
  const [mainContactDialogOpen, setMainContactDialogOpen] = useState(false)
  const [vacancyDialogOpen, setVacancyDialogOpen] = useState(false)
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false)

  const detailKey = ['applications', 'detail', applicationId]

  const { data: app, isLoading } = useQuery({
    queryKey: detailKey,
    queryFn: () => applicationsApi.get(applicationId),
  })

  const { data: company } = useQuery({
    queryKey: ['companies', 'detail', app?.companyId],
    queryFn: () => companiesApi.get(app!.companyId),
    enabled: !!app?.companyId,
  })

  const { data: jobRole } = useQuery({
    queryKey: ['job-roles', 'detail', app?.jobRoleId],
    queryFn: () => jobRolesApi.get(app!.jobRoleId),
    enabled: !!app?.jobRoleId,
  })

  const { data: contact } = useQuery({
    queryKey: ['contacts', 'detail', app?.mainContactId],
    queryFn: () => contactsApi.get(app!.mainContactId!),
    enabled: !!app?.mainContactId,
  })

  const { data: interviews } = useQuery({
    queryKey: ['interviews', 'byApplication', applicationId],
    queryFn: () => interviewsApi.list({ applicationId, pageSize: 50 }),
  })

  const { data: myCandidate } = useQuery({
    queryKey: ['candidates', 'me'],
    queryFn: () => candidatesApi.list({ pageSize: 1 }),
  })
  const candidateId = myCandidate?.items[0]?.id

  const updateStatus = useMutation({
    mutationFn: (status: string) => applicationsApi.updateStatus(applicationId, status),
    onMutate: async (status) => {
      await qc.cancelQueries({ queryKey: detailKey })
      const previous = qc.getQueryData<JobApplication>(detailKey)
      qc.setQueryData<JobApplication>(detailKey, (old) => (old ? { ...old, status } : old))
      return { previous }
    },
    onError: (_err, _status, context) => {
      if (context?.previous) qc.setQueryData(detailKey, context.previous)
      toast.error('Failed to update stage')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })

  const updatePriority = useMutation({
    mutationFn: (priority: string) =>
      applicationsApi.update(applicationId, {
        status: app!.status,
        priority,
        appliedDate: app!.appliedDate,
        nextFollowUpDate: app!.nextFollowUpDate,
        resumeVersion: app!.resumeVersion,
        coverLetterVersion: app!.coverLetterVersion,
        expectedSalary: app!.expectedSalary,
        actualOfferSalary: app!.actualOfferSalary,
        currency: app!.currency,
        rejectionReason: app!.rejectionReason,
        cvId: app!.cvId,
        mainContactId: app!.mainContactId,
      }),
    onMutate: async (priority) => {
      await qc.cancelQueries({ queryKey: detailKey })
      const previous = qc.getQueryData<JobApplication>(detailKey)
      qc.setQueryData<JobApplication>(detailKey, (old) => (old ? { ...old, priority } : old))
      return { previous }
    },
    onError: (_err, _priority, context) => {
      if (context?.previous) qc.setQueryData(detailKey, context.previous)
      toast.error('Failed to update priority')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })

  const update = useMutation({
    mutationFn: (dto: Partial<CreateApplicationDto>) => applicationsApi.update(applicationId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      toast.success('Application updated')
      setEditOpen(false)
    },
  })

  const remove = useMutation({
    mutationFn: () => applicationsApi.delete(applicationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      toast.success('Application deleted')
      onClose?.()
    },
  })

  if (isLoading) return <DetailSkeleton />

  if (!app) {
    return (
      <div className='space-y-4'>
        <Panel className='text-center text-sm text-muted-foreground'>
          We couldn’t find that application. It may have been deleted.
        </Panel>
      </div>
    )
  }

  const stageIndex = stages.findIndex((s) => s.status === app.status)
  const stageAccent = stageIndex >= 0 ? STAGE_ACCENTS[stageIndex % STAGE_ACCENTS.length] : UNKNOWN_STAGE_ACCENT
  const stageLabel = stages.find((s) => s.status === app.status)?.label ?? formatStatusLabel(app.status)
  const isTerminalStage = (stages.find((s) => s.status === app.status)?.badgeVariant ?? 'secondary') === 'destructive'

  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-end'>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={() => setEditOpen(true)}>
            <Pencil className='mr-1.5 size-4' /> Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon' aria-label='More actions'>
                <MoreHorizontal className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem className='text-destructive' onClick={() => remove.mutate()}>
                <Trash2 className='mr-2 size-4' /> Delete application
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Panel className='space-y-5'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex min-w-0 items-start gap-4'>
            <div className='flex size-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400'>
              <Building2 className='size-6' />
            </div>
            <div className='min-w-0'>
              <h1 className='truncate text-2xl font-bold tracking-tight'>{app.jobRoleTitle ?? 'Untitled vacancy'}</h1>
              <p className='truncate text-muted-foreground'>{app.companyName ?? `Company #${app.companyId}`}</p>
              <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
                {jobRole?.workType && (
                  <span className='inline-flex items-center gap-1'>
                    <MapPin className='size-3' /> {jobRole.workType}
                  </span>
                )}
                {jobRole?.employmentType && <span>{jobRole.employmentType}</span>}
                {app.appliedDate && <span>Applied {formatDistanceToNowStrict(new Date(app.appliedDate), { addSuffix: true })}</span>}
              </div>
            </div>
          </div>
          <div className='flex shrink-0 items-center gap-2'>
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', stageAccent.tint)}>
              <span className={cn('size-1.5 rounded-full', stageAccent.dot)} />
              {stageLabel}
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <button type='button' className='inline-flex rounded-md focus-visible:outline-none'>
                  <Badge variant={app.priority === 'High' ? 'destructive' : 'secondary'} className='cursor-pointer text-xs hover:opacity-80'>
                    {app.priority} priority
                  </Badge>
                </button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-3' align='end'>
                <p className='mb-2 text-xs font-medium text-muted-foreground'>Priority</p>
                <PriorityPicker
                  priorities={PRIORITIES}
                  value={app.priority}
                  onChange={(priority) => updatePriority.mutate(priority)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <ApplicationJourney
          stages={stages}
          status={app.status}
          rejectionReason={app.rejectionReason}
          onChangeStatus={(status) => updateStatus.mutate(status)}
          disabled={updateStatus.isPending}
        />

        {!isTerminalStage && app.nextFollowUpDate && (
          <div className={cn('flex items-center gap-3 rounded-xl border p-3 text-sm', FOLLOWUP_TINTS[app.followUpStatus ?? ''] ?? DEFAULT_FOLLOWUP_TINT)}>
            <CalendarClock className='size-4 shrink-0' />
            <span>
              Follow up <span className='font-semibold'>{format(new Date(app.nextFollowUpDate), 'MMM d')}</span> ·{' '}
              {formatDistanceToNowStrict(new Date(app.nextFollowUpDate), { addSuffix: true })}
            </span>
          </div>
        )}
      </Panel>

      <div className='grid gap-5 lg:grid-cols-3'>
        <div className='space-y-5 lg:col-span-2'>
          <Panel className='space-y-4'>
            <SectionHeading
              icon={Briefcase}
              title='About the role'
              action={
                jobRole && (
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-7 text-muted-foreground hover:text-foreground'
                    aria-label='Edit vacancy'
                    onClick={() => setVacancyDialogOpen(true)}
                  >
                    <Pencil className='size-3.5' />
                  </Button>
                )
              }
            />
            <div className='flex flex-wrap gap-2'>
              {jobRole?.workType && <Badge variant='outline'>{jobRole.workType}</Badge>}
              {jobRole?.employmentType && <Badge variant='outline'>{jobRole.employmentType}</Badge>}
              {jobRole?.source && <Badge variant='outline'>via {jobRole.source}</Badge>}
              {(jobRole?.salaryMin || jobRole?.salaryMax) && (
                <Badge variant='outline'>
                  {jobRole.currency ?? ''} {jobRole.salaryMin ?? '—'} – {jobRole.salaryMax ?? '—'}
                </Badge>
              )}
            </div>
            {jobRole?.jobLink && (
              <a
                href={jobRole.jobLink}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:underline dark:text-violet-400'
              >
                View original posting <ExternalLink className='size-3.5' />
              </a>
            )}
            <div>
              <p className='text-xs font-medium text-muted-foreground'>Description</p>
              {app.jobRoleDescription || jobRole?.description ? (
                <ExpandableText text={jobRole?.description ?? app.jobRoleDescription ?? ''} />
              ) : (
                <EmptyNote>No description on file for this vacancy yet.</EmptyNote>
              )}
            </div>
            {jobRole?.requirements && (
              <div>
                <p className='text-xs font-medium text-muted-foreground'>Requirements</p>
                <ExpandableText text={jobRole.requirements} />
              </div>
            )}
          </Panel>

          <Panel className='space-y-3'>
            <SectionHeading icon={Users} title='Interviews' />
            <InterviewTimeline interviews={interviews?.items ?? []} />
          </Panel>

          <Panel className='space-y-3'>
            <SectionHeading icon={StickyNote} title='Notes' />
            <ApplicationNotes applicationId={applicationId} />
          </Panel>
        </div>

        <div className='space-y-5'>
          <Panel className='space-y-3'>
            <SectionHeading icon={CalendarClock} title='Timeline' />
            <Field label='Applied'>{app.appliedDate ? format(new Date(app.appliedDate), 'MMM d, yyyy') : '—'}</Field>
            <Field label='Last activity'>{app.lastActivityDate ? format(new Date(app.lastActivityDate), 'MMM d, yyyy') : '—'}</Field>
            <Field label='Next follow-up'>{app.nextFollowUpDate ? format(new Date(app.nextFollowUpDate), 'MMM d, yyyy') : '—'}</Field>
          </Panel>

          <Panel className='space-y-3'>
            <SectionHeading icon={Wallet} title='Compensation' />
            <Field label='Expected salary'>
              {app.expectedSalary ? `${app.currency ?? ''} ${app.expectedSalary.toLocaleString()}` : '—'}
            </Field>
            {app.actualOfferSalary != null && (
              <div className='rounded-lg bg-emerald-50 p-2.5 text-sm dark:bg-emerald-500/10'>
                <span className='font-medium text-emerald-700 dark:text-emerald-400'>
                  Offer: {app.currency ?? ''} {app.actualOfferSalary.toLocaleString()} 🎉
                </span>
              </div>
            )}
          </Panel>

          <Panel className='space-y-3'>
            <SectionHeading
              icon={Building2}
              title='Company'
              action={
                company && (
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-7 text-muted-foreground hover:text-foreground'
                    aria-label='Edit company'
                    onClick={() => setCompanyDialogOpen(true)}
                  >
                    <Pencil className='size-3.5' />
                  </Button>
                )
              }
            />
            {company?.industry && <Field label='Industry'>{company.industry}</Field>}
            {company?.companySize && <Field label='Size'>{company.companySize}</Field>}
            {(company?.city || company?.country) && (
              <Field label='Location'>{[company?.city, company?.country].filter(Boolean).join(', ')}</Field>
            )}
            {(company?.website || company?.linkedInUrl) && (
              <div className='flex gap-2 pt-1'>
                {company?.website && (
                  <Button variant='outline' size='sm' asChild>
                    <a href={company.website} target='_blank' rel='noopener noreferrer'>
                      <Globe className='mr-1.5 size-3.5' /> Website
                    </a>
                  </Button>
                )}
                {company?.linkedInUrl && (
                  <Button variant='outline' size='sm' asChild>
                    <a href={company.linkedInUrl} target='_blank' rel='noopener noreferrer'>
                      <ExternalLink className='mr-1.5 size-3.5' /> LinkedIn
                    </a>
                  </Button>
                )}
              </div>
            )}
          </Panel>

          <Panel className='space-y-3'>
            <SectionHeading
              icon={Users}
              title='Main contact'
              action={
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-7 text-muted-foreground hover:text-foreground'
                  aria-label={contact ? 'Edit main contact' : 'Add main contact'}
                  onClick={() => setMainContactDialogOpen(true)}
                >
                  {contact ? <Pencil className='size-3.5' /> : <Plus className='size-3.5' />}
                </Button>
              }
            />
            {contact ? (
              <>
                <p className='text-sm font-semibold'>{contact.fullName}</p>
                {contact.jobTitle && <p className='text-xs text-muted-foreground'>{contact.jobTitle}</p>}
                <div className='space-y-1.5 pt-1'>
                  {contact.email && <Field label='Email'>{contact.email}</Field>}
                  {contact.phone && <Field label='Phone'>{contact.phone}</Field>}
                </div>
                <div className='flex flex-wrap gap-2 pt-1'>
                  {contact.email && (
                    <Button variant='outline' size='sm' asChild>
                      <a href={`mailto:${contact.email}`}>
                        <Mail className='mr-1.5 size-3.5' /> Email
                      </a>
                    </Button>
                  )}
                  {contact.phone && (
                    <>
                      <Button variant='outline' size='sm' asChild>
                        <a href={`tel:${contact.phone}`}>
                          <Phone className='mr-1.5 size-3.5' /> Call
                        </a>
                      </Button>
                      <Button variant='outline' size='sm' asChild>
                        <a href={toWhatsAppUrl(contact.phone)} target='_blank' rel='noopener noreferrer'>
                          <IconWhatsapp className='mr-1.5 size-3.5' /> WhatsApp
                        </a>
                      </Button>
                    </>
                  )}
                  {contact.linkedInUrl && (
                    <Button variant='outline' size='sm' asChild>
                      <a href={contact.linkedInUrl} target='_blank' rel='noopener noreferrer'>
                        <ExternalLink className='mr-1.5 size-3.5' /> LinkedIn
                      </a>
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <EmptyNote>No contact added yet — add one above.</EmptyNote>
            )}
          </Panel>

          <Panel className='space-y-3'>
            <SectionHeading icon={FileText} title='Documents' />
            {app.cvId && app.cvFileName ? (
              <div className='space-y-2'>
                <div className='flex items-center gap-2 rounded-lg border p-2.5 text-sm'>
                  <FileText className='size-4 shrink-0 text-muted-foreground' />
                  <span className='min-w-0 flex-1 truncate'>{app.cvFileName}</span>
                </div>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' className='flex-1' onClick={() => viewCvFile({ id: app.cvId! })}>
                    <Eye className='mr-1.5 size-3.5' /> View
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex-1'
                    onClick={() => downloadCvFile({ id: app.cvId!, fileName: app.cvFileName! })}
                  >
                    <Download className='mr-1.5 size-3.5' /> Download
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyNote>No resume attached yet.</EmptyNote>
            )}
            {app.resumeVersion && <Field label='Resume version'>{app.resumeVersion}</Field>}
            {app.coverLetterVersion && <Field label='Cover letter'>{app.coverLetterVersion}</Field>}
          </Panel>
        </div>
      </div>

      <ApplicationsMutateDialog
        key={`edit-${editOpen ? 'open' : 'closed'}`}
        open={editOpen}
        onOpenChange={setEditOpen}
        currentRow={app}
        candidateId={candidateId}
        isPending={update.isPending}
        onSubmit={(dto) => update.mutate(dto)}
      />

      <ApplicationMainContactDialog
        key={`main-contact-${mainContactDialogOpen ? 'open' : 'closed'}`}
        open={mainContactDialogOpen}
        onOpenChange={setMainContactDialogOpen}
        application={app}
        contact={contact}
      />

      {jobRole && (
        <ApplicationVacancyDialog
          key={`vacancy-${vacancyDialogOpen ? 'open' : 'closed'}`}
          open={vacancyDialogOpen}
          onOpenChange={setVacancyDialogOpen}
          jobRole={jobRole}
        />
      )}

      {company && (
        <ApplicationCompanyDialog
          key={`company-${companyDialogOpen ? 'open' : 'closed'}`}
          open={companyDialogOpen}
          onOpenChange={setCompanyDialogOpen}
          company={company}
        />
      )}
    </div>
  )
}
