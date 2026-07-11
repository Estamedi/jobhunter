import { type ElementType } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Check,
  CircleDot,
  FileText,
  Heart,
  Plus,
  Trophy,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { dashboardApi } from './api'

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

const applications = [
  {
    initials: 'NO',
    company: 'Notion',
    role: 'Frontend Engineer',
    date: 'Jul 9',
    status: 'Interviewing',
  },
  {
    initials: 'LI',
    company: 'Linear',
    role: 'Frontend Engineer',
    date: 'Jul 7',
    status: 'Applied',
  },
  {
    initials: 'FI',
    company: 'Figma',
    role: 'Product Designer',
    date: 'Jul 5',
    status: 'Wishlist',
  },
  {
    initials: 'ST',
    company: 'Stripe',
    role: 'Frontend Engineer',
    date: 'Jul 1',
    status: 'Rejected',
  },
] as const

const cvs = [
  { title: 'Frontend Engineer', version: 'v3', date: 'Jul 8, 2026' },
  {
    title: 'Frontend Engineer (duplicate)',
    version: 'v2',
    date: 'Jul 2, 2026',
  },
  { title: 'Product Manager', version: 'v1', date: 'Jun 20, 2026' },
] as const

const notes = [
  {
    text: 'Follow up with Notion recruiter by Friday.',
    date: 'Jul 9, 2026',
  },
  {
    text: 'Prep system design questions for Linear interview.',
    date: 'Jul 7, 2026',
  },
] as const

type StatValue = (typeof statCards)[number]['value']
type Status = (typeof applications)[number]['status']

export function CrmDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'overall'],
    queryFn: dashboardApi.overall,
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
        <h1 className='text-xl leading-7 font-bold'>Good evening, Alex.</h1>
        <p className='text-xs leading-4 text-tapinti-muted-foreground'>
          {activeApplications} active applications · {cvs.length} CV versions
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
  return (
    <Card className='min-h-[420px] gap-0 overflow-hidden rounded-[14px] border-tapinti-border bg-tapinti-surface py-0 shadow-none xl:min-h-[678px]'>
      <PanelHeader title='Recent Applications' action='Add applicant' />
      <CardContent className='px-0'>
        {applications.map((application) => (
          <ApplicationRow
            key={`${application.company}-${application.date}`}
            {...application}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function PanelHeader({ title, action }: { title: string; action?: string }) {
  return (
    <CardHeader className='flex h-[45px] flex-row items-center justify-between gap-3 border-b border-tapinti-border px-4 py-3'>
      <CardTitle className='text-sm leading-5 font-semibold text-tapinti-foreground'>
        {title}
      </CardTitle>
      {action && (
        <button className='inline-flex items-center gap-1 text-xs leading-4 font-semibold text-tapinti-primary'>
          <Plus className='size-3.5' />
          {action}
        </button>
      )}
    </CardHeader>
  )
}

function ApplicationRow({
  initials,
  company,
  role,
  date,
  status,
}: (typeof applications)[number]) {
  return (
    <div className='flex min-h-[61px] items-center justify-between gap-4 border-b border-tapinti-border px-4 py-3 last:border-b-0'>
      <div className='flex min-w-0 items-center gap-3'>
        <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-tapinti-surface-muted text-xs leading-4 font-semibold text-tapinti-muted-foreground'>
          {initials}
        </span>
        <div className='min-w-0'>
          <p className='truncate text-sm leading-5 font-medium text-tapinti-foreground'>
            {company}
          </p>
          <p className='truncate text-xs leading-4 text-tapinti-muted-foreground'>
            {role} · {date}
          </p>
        </div>
      </div>
      <StatusBadge status={status} />
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const statusClass = {
    Interviewing:
      'bg-tapinti-status-interview-bg text-tapinti-status-interview-fg',
    Applied: 'bg-tapinti-status-applied-bg text-tapinti-status-applied-fg',
    Wishlist: 'bg-tapinti-status-wishlist-bg text-tapinti-status-wishlist-fg',
    Rejected: 'bg-tapinti-status-rejected-bg text-tapinti-status-rejected-fg',
  }[status]

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
  return (
    <Card className='h-auto gap-0 overflow-hidden rounded-[14px] border-tapinti-border bg-tapinti-surface py-0 shadow-none xl:h-[202px]'>
      <PanelHeader title='CVs' action='Add CV' />
      <CardContent className='px-0'>
        {cvs.map((cv, index) => (
          <CvRow
            key={`${cv.version}-${cv.title}`}
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
  cv: (typeof cvs)[number]
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
          {cv.title}
        </p>
        <p className='truncate text-[10px] leading-[15px] text-tapinti-muted-foreground'>
          {cv.version} · {cv.date}
        </p>
      </div>
    </div>
  )
}

function NotesPanel() {
  return (
    <Card className='h-auto gap-0 overflow-hidden rounded-[14px] border-tapinti-border bg-tapinti-surface py-0 shadow-none xl:h-[460px]'>
      <PanelHeader title='Notes' />
      <CardContent className='px-0'>
        <div className='flex min-h-[55px] items-center gap-2 border-b border-tapinti-border px-3 py-2.5'>
          <div className='flex h-[34px] min-w-0 flex-1 items-center rounded-[10px] border border-tapinti-border bg-tapinti-surface-muted px-3 text-xs leading-[14.5px] text-tapinti-muted-foreground/50'>
            Jot something down...
          </div>
          <button className='flex size-7 shrink-0 items-center justify-center rounded-[10px] bg-tapinti-control text-tapinti-primary-foreground'>
            <Check className='size-4' />
          </button>
        </div>
        <div>
          {notes.map((note, index) => (
            <NoteRow
              key={note.date}
              note={note}
              bordered={index < notes.length - 1}
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
}: {
  note: (typeof notes)[number]
  bordered: boolean
}) {
  return (
    <div
      className={cn(
        'min-h-[78px] px-3 py-2.5',
        bordered && 'border-b border-tapinti-border'
      )}
    >
      <div className='flex gap-2'>
        <p className='max-w-[191px] text-xs leading-[19.5px] text-tapinti-foreground'>
          {note.text}
        </p>
        <CircleDot className='mt-0.5 size-4 shrink-0 text-tapinti-muted-foreground/30' />
      </div>
      <p className='mt-1 text-[10px] leading-[15px] text-tapinti-muted-foreground'>
        {note.date}
      </p>
    </div>
  )
}
