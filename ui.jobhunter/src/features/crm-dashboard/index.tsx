import { useState, type ElementType } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  Check,
  FileText,
  Heart,
  Pencil,
  Plus,
  Trash2,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { dashboardApi } from './api'
import { notesApi, type Note } from '@/features/notes/api'
import { applicationsApi, type JobApplication } from '@/features/applications/api'
import { cvsApi, type Cv } from '@/features/cvs/api'

const statCards = [
  {
    label: 'Interviewing',
    value: 'interviewing',
    icon: Users,
  },
  {
    label: 'Applied',
    value: 'applied',
    icon: FileText,
  },
  {
    label: 'Wishlist',
    value: 'wishlist',
    icon: Heart,
  },
  {
    label: 'Offer',
    value: 'offer',
    icon: Trophy,
  },
] as const

const RECENT_APPLICATIONS_COUNT = 8
const RECENT_CVS_COUNT = 3

const STATUS_STYLES: Record<string, string> = {
  Wishlist: 'bg-tapinti-status-wishlist-bg text-tapinti-status-wishlist-fg',
  Applied: 'bg-tapinti-status-applied-bg text-tapinti-status-applied-fg',
  PhoneScreen: 'bg-tapinti-status-interview-bg text-tapinti-status-interview-fg',
  HRInterview: 'bg-tapinti-status-interview-bg text-tapinti-status-interview-fg',
  TechnicalInterview: 'bg-tapinti-status-interview-bg text-tapinti-status-interview-fg',
  FinalInterview: 'bg-tapinti-status-interview-bg text-tapinti-status-interview-fg',
  Offer: 'bg-tapinti-primary-soft text-tapinti-primary',
  Accepted: 'bg-tapinti-primary-soft text-tapinti-primary',
  Rejected: 'bg-tapinti-status-rejected-bg text-tapinti-status-rejected-fg',
  Withdrawn: 'bg-tapinti-status-rejected-bg text-tapinti-status-rejected-fg',
  Ghosted: 'bg-tapinti-status-rejected-bg text-tapinti-status-rejected-fg',
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

type StatValue = (typeof statCards)[number]['value']

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function CrmDashboard() {
  const email = useAuthStore((state) => state.auth.user?.email)
  const name = email?.split('@')[0] || 'there'
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'overall'],
    queryFn: dashboardApi.overall,
  })
  const { data: cvsCountResult } = useQuery({
    queryKey: ['cvs', 'count'],
    queryFn: () => cvsApi.list({ pageSize: 1 }),
  })

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const values: Record<StatValue, number> = {
    interviewing: data?.upcomingInterviews ?? 1,
    applied: data?.activeApplications ?? 1,
    wishlist: Math.max(
      (data?.totalCompanies ?? 1) - (data?.activeApplications ?? 0),
      1
    ),
    offer: data?.offersReceived ?? 0,
  }

  const activeApplications = data?.activeApplications ?? 3

  return (
    <div className='mx-auto max-w-[1016px] space-y-4 font-inter text-tapinti-foreground'>
      <header className='space-y-0.5'>
        <h1 className='text-xl leading-7 font-bold'>
          {getGreeting()}, {name}.
        </h1>
        <p className='text-xs leading-4 text-tapinti-muted-foreground'>
          {activeApplications} active applications · {cvsCountResult?.total ?? 0} CV versions
        </p>
      </header>

      <section className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        {statCards.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={values[stat.value]}
            icon={stat.icon}
          />
        ))}
      </section>

      <section className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_338px]'>
        <ApplicationsPanel />
        <aside className='space-y-4'>
          <CvPanel />
          <NotesPanel />
        </aside>
      </section>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className='mx-auto max-w-[1016px] space-y-4'>
      <div className='space-y-1'>
        <Skeleton className='h-7 w-48 bg-black/10' />
        <Skeleton className='h-4 w-52 bg-black/10' />
      </div>
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className='h-[58px] rounded-[10px] bg-black/10'
          />
        ))}
      </div>
      <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_338px]'>
        <Skeleton className='h-[678px] rounded-[14px] bg-black/10' />
        <div className='space-y-4'>
          <Skeleton className='h-[202px] rounded-[14px] bg-black/10' />
          <Skeleton className='h-[460px] rounded-[14px] bg-black/10' />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: ElementType
}) {
  return (
    <Card className='h-[58px] gap-0 rounded-[10px] border-tapinti-border bg-tapinti-surface px-4 py-3 text-tapinti-foreground shadow-none'>
      <div className='flex h-full items-center justify-between gap-3'>
        <div className='flex items-center gap-2.5'>
          <span className='flex size-8 items-center justify-center rounded-[10px] bg-tapinti-primary-soft text-tapinti-primary'>
            <Icon className='size-4' />
          </span>
          <span className='text-xs leading-4 text-tapinti-muted-foreground'>
            {label}
          </span>
        </div>
        <span className='text-xl leading-7 font-bold'>{value}</span>
      </div>
    </Card>
  )
}

function ApplicationsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['applications', 'recent'],
    queryFn: () => applicationsApi.list({ pageSize: RECENT_APPLICATIONS_COUNT }),
  })
  const applications = data?.items ?? []

  return (
    <Card className='min-h-[420px] gap-0 overflow-hidden rounded-[14px] border-tapinti-border bg-tapinti-surface py-0 shadow-none xl:min-h-[678px]'>
      <PanelHeader title='Recent Applications' action='Add applicant' actionHref='/applications' />
      <CardContent className='px-0'>
        {isLoading && (
          <div className='space-y-2 p-4'>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className='h-[61px] w-full bg-black/10' />
            ))}
          </div>
        )}
        {!isLoading && applications.length === 0 && (
          <p className='px-4 py-8 text-center text-xs text-tapinti-muted-foreground'>
            No applications yet.
          </p>
        )}
        {applications.map((application, index) => (
          <ApplicationRow
            key={application.id}
            application={application}
            bordered={index < applications.length - 1}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function PanelHeader({
  title,
  action,
  actionHref,
}: {
  title: string
  action?: string
  actionHref?: string
}) {
  return (
    <CardHeader className='flex h-[45px] flex-row items-center justify-between gap-3 border-b border-tapinti-border px-4 py-3'>
      <CardTitle className='text-sm leading-5 font-semibold text-tapinti-foreground'>
        {title}
      </CardTitle>
      {action && actionHref && (
        <Link
          to={actionHref}
          className='inline-flex items-center gap-1 text-xs leading-4 font-semibold text-tapinti-primary'
        >
          <Plus className='size-3.5' />
          {action}
        </Link>
      )}
    </CardHeader>
  )
}

function ApplicationRow({
  application,
  bordered,
}: {
  application: JobApplication
  bordered: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-h-[61px] items-center justify-between gap-4 px-4 py-3',
        bordered && 'border-b border-tapinti-border'
      )}
    >
      <div className='flex min-w-0 items-center gap-3'>
        <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-tapinti-surface-muted text-xs leading-4 font-semibold text-tapinti-muted-foreground'>
          {initialsFor(application.companyName ?? 'Company')}
        </span>
        <div className='min-w-0'>
          <p className='truncate text-sm leading-5 font-medium text-tapinti-foreground'>
            {application.companyName ?? 'Company'}
          </p>
          <p className='truncate text-xs leading-4 text-tapinti-muted-foreground'>
            {application.jobRoleTitle ?? 'Role'}
            {application.appliedDate ? ` · ${format(new Date(application.appliedDate), 'MMM d')}` : ''}
          </p>
        </div>
      </div>
      <StatusBadge status={application.status} />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusClass = STATUS_STYLES[status] ?? 'bg-tapinti-surface-muted text-tapinti-muted-foreground'

  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-[11px] leading-[16.5px] font-semibold',
        statusClass
      )}
    >
      {status}
    </span>
  )
}

function CvPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['cvs', 'recent'],
    queryFn: () => cvsApi.list({ pageSize: RECENT_CVS_COUNT }),
  })
  const cvs = data?.items ?? []

  return (
    <Card className='h-auto gap-0 overflow-hidden rounded-[14px] border-tapinti-border bg-tapinti-surface py-0 shadow-none xl:h-[202px]'>
      <PanelHeader title='CVs' action='Add CV' actionHref='/cvs' />
      <CardContent className='px-0'>
        {isLoading && (
          <div className='space-y-2 p-3'>
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className='h-[51px] w-full bg-black/10' />
            ))}
          </div>
        )}
        {!isLoading && cvs.length === 0 && (
          <p className='px-4 py-6 text-center text-xs text-tapinti-muted-foreground'>
            No CVs uploaded yet.
          </p>
        )}
        {cvs.map((cv, index) => (
          <CvRow
            key={cv.id}
            cv={cv}
            bordered={index < cvs.length - 1}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function CvRow({
  cv,
  bordered,
}: {
  cv: Cv
  bordered: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-h-[51px] items-center gap-3 px-4 py-2.5',
        bordered && 'border-b border-tapinti-border'
      )}
    >
      <span className='flex size-7 shrink-0 items-center justify-center rounded-[10px] bg-tapinti-primary-soft text-tapinti-primary-icon'>
        <FileText className='size-3.5' />
      </span>
      <div className='min-w-0'>
        <p className='truncate text-xs leading-4 font-medium text-tapinti-foreground'>
          {cv.fileName}
        </p>
        <p className='truncate text-[10px] leading-[15px] text-tapinti-muted-foreground'>
          {format(new Date(cv.uploadedDate), 'MMM d, yyyy')}
        </p>
      </div>
    </div>
  )
}

const RECENT_NOTES_COUNT = 5

function NotesPanel() {
  const qc = useQueryClient()
  const [draft, setDraft] = useState('')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editingContent, setEditingContent] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['notes', 'recent'],
    queryFn: () => notesApi.list({ pageSize: RECENT_NOTES_COUNT }),
  })
  const notes = data?.items ?? []

  const invalidateNotes = () => qc.invalidateQueries({ queryKey: ['notes'] })

  const create = useMutation({
    mutationFn: (content: string) => notesApi.create({ content }),
    onSuccess: () => {
      invalidateNotes()
      setDraft('')
    },
    onError: () => toast.error('Failed to add note'),
  })

  const update = useMutation({
    mutationFn: ({ id, content, applicationId }: { id: number; content: string; applicationId?: number }) =>
      notesApi.update(id, { content, applicationId }),
    onSuccess: () => {
      invalidateNotes()
      setEditingNote(null)
    },
    onError: () => toast.error('Failed to update note'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => notesApi.delete(id),
    onSuccess: () => invalidateNotes(),
    onError: () => toast.error('Failed to delete note'),
  })

  function submitDraft() {
    const content = draft.trim()
    if (!content || create.isPending) return
    create.mutate(content)
  }

  function startEdit(note: Note) {
    setEditingNote(note)
    setEditingContent(note.content)
  }

  function saveEdit() {
    const content = editingContent.trim()
    if (!content || editingNote == null) return
    update.mutate({ id: editingNote.id, content, applicationId: editingNote.applicationId })
  }

  return (
    <Card className='h-auto gap-0 overflow-hidden rounded-[14px] border-tapinti-border bg-tapinti-surface py-0 shadow-none xl:h-[460px]'>
      <PanelHeader title='Notes' />
      <CardContent className='px-0'>
        <div className='flex min-h-[55px] items-center gap-2 border-b border-tapinti-border px-3 py-2.5'>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submitDraft()
              }
            }}
            placeholder='Jot something down...'
            className='flex h-[34px] min-w-0 flex-1 items-center rounded-[10px] border border-tapinti-border bg-tapinti-surface-muted px-3 text-xs leading-[14.5px] text-tapinti-foreground outline-none placeholder:text-tapinti-muted-foreground/50 focus:ring-1 focus:ring-tapinti-primary'
          />
          <button
            onClick={submitDraft}
            disabled={create.isPending || !draft.trim()}
            className='flex size-7 shrink-0 items-center justify-center rounded-[10px] bg-tapinti-control text-tapinti-primary-foreground disabled:opacity-50'
          >
            <Check className='size-4' />
          </button>
        </div>
        <div>
          {isLoading && (
            <div className='space-y-2 p-3'>
              <Skeleton className='h-14 w-full bg-black/10' />
              <Skeleton className='h-14 w-full bg-black/10' />
            </div>
          )}
          {!isLoading && notes.length === 0 && (
            <p className='px-3 py-8 text-center text-xs text-tapinti-muted-foreground'>
              No notes yet.
            </p>
          )}
          {notes.map((note, index) => (
            <NoteRow
              key={note.id}
              note={note}
              bordered={index < notes.length - 1}
              isEditing={editingNote?.id === note.id}
              editingContent={editingContent}
              onEditingContentChange={setEditingContent}
              onStartEdit={() => startEdit(note)}
              onCancelEdit={() => setEditingNote(null)}
              onSaveEdit={saveEdit}
              onDelete={() => remove.mutate(note.id)}
              isSaving={update.isPending && editingNote?.id === note.id}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function NoteRow({
  note,
  bordered,
  isEditing,
  editingContent,
  onEditingContentChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  isSaving,
}: {
  note: Note
  bordered: boolean
  isEditing: boolean
  editingContent: string
  onEditingContentChange: (value: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: () => void
  isSaving: boolean
}) {
  if (isEditing) {
    return (
      <div
        className={cn(
          'min-h-[78px] space-y-1.5 px-3 py-2.5',
          bordered && 'border-b border-tapinti-border'
        )}
      >
        <textarea
          autoFocus
          value={editingContent}
          onChange={(e) => onEditingContentChange(e.target.value)}
          rows={2}
          className='w-full resize-none rounded-[10px] border border-tapinti-border bg-tapinti-surface-muted px-2 py-1.5 text-xs leading-[19.5px] text-tapinti-foreground outline-none focus:ring-1 focus:ring-tapinti-primary'
        />
        <div className='flex justify-end gap-1'>
          <button
            onClick={onCancelEdit}
            className='flex size-6 items-center justify-center rounded-[8px] text-tapinti-muted-foreground hover:bg-tapinti-surface-muted'
          >
            <X className='size-3.5' />
          </button>
          <button
            onClick={onSaveEdit}
            disabled={isSaving || !editingContent.trim()}
            className='flex size-6 items-center justify-center rounded-[8px] bg-tapinti-control text-tapinti-primary-foreground disabled:opacity-50'
          >
            <Check className='size-3.5' />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group min-h-[78px] px-3 py-2.5',
        bordered && 'border-b border-tapinti-border'
      )}
    >
      <div className='flex gap-2'>
        <p className='max-w-[191px] flex-1 text-xs leading-[19.5px] text-tapinti-foreground'>
          {note.content}
        </p>
        <div className='flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
          <button
            onClick={onStartEdit}
            className='flex size-5 items-center justify-center rounded text-tapinti-muted-foreground hover:text-tapinti-foreground'
          >
            <Pencil className='size-3.5' />
          </button>
          <button
            onClick={onDelete}
            className='flex size-5 items-center justify-center rounded text-tapinti-muted-foreground hover:text-destructive'
          >
            <Trash2 className='size-3.5' />
          </button>
        </div>
      </div>
      <p className='mt-1 text-[10px] leading-[15px] text-tapinti-muted-foreground'>
        {format(new Date(note.lastModified), 'MMM d, yyyy')}
      </p>
    </div>
  )
}
