import { type ElementType } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { dashboardApi } from './api'

const pipelineStages = [
  {
    title: 'Applied',
    valueKey: 'activeApplications',
    description: 'Roles still moving',
    dot: 'bg-sky-500',
  },
  {
    title: 'Interview',
    valueKey: 'upcomingInterviews',
    description: 'Scheduled conversations',
    dot: 'bg-violet-500',
  },
  {
    title: 'Follow-up',
    valueKey: 'followUpsDueToday',
    description: 'Due today',
    dot: 'bg-amber-500',
  },
  {
    title: 'Offer',
    valueKey: 'offersReceived',
    description: 'Won opportunities',
    dot: 'bg-emerald-500',
  },
] as const

function StatCard({
  title,
  value,
  icon: Icon,
  sub,
  accent = 'neutral',
}: {
  title: string
  value: number
  icon: ElementType
  sub?: string
  accent?: 'neutral' | 'brand' | 'warning' | 'success' | 'danger'
}) {
  const accentClass = {
    neutral: 'border-border bg-card text-foreground',
    brand:
      'border-sky-200/70 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300',
    warning:
      'border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    success:
      'border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    danger:
      'border-red-200/80 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
  }[accent]

  return (
    <Card className='gap-4 overflow-hidden border-border/70 bg-card/80 py-5 shadow-sm shadow-slate-950/5 backdrop-blur'>
      <CardHeader className='flex flex-row items-center justify-between px-5 pb-0'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {title}
        </CardTitle>
        <span className={cn('rounded-xl border p-2', accentClass)}>
          <Icon className='size-4' />
        </span>
      </CardHeader>
      <CardContent className='px-5'>
        <div className='text-3xl font-semibold tracking-tight'>{value}</div>
        {sub && <p className='mt-1 text-xs text-muted-foreground'>{sub}</p>}
      </CardContent>
    </Card>
  )
}

export function CrmDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'overall'],
    queryFn: dashboardApi.overall,
  })

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-48 rounded-3xl' />
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-32 rounded-2xl' />
          ))}
        </div>
        <div className='grid gap-4 xl:grid-cols-[1.45fr_0.9fr]'>
          <Skeleton className='h-80 rounded-3xl' />
          <Skeleton className='h-80 rounded-3xl' />
        </div>
      </div>
    )
  }

  if (!data) return null

  const nextInterview = data.upcomingInterviewsList[0]
  const overdueFollowUps = data.followUpsOverdue
  const totalFollowUps = data.followUpsDueToday + overdueFollowUps
  const offerRate = data.totalApplications
    ? Math.round((data.offersReceived / data.totalApplications) * 100)
    : 0

  const stageValue = (key: (typeof pipelineStages)[number]['valueKey']) =>
    data[key]

  return (
    <div className='space-y-5'>
      <section className='relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-sm shadow-slate-950/5 md:p-6'>
        <div className='absolute end-0 top-0 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl' />
        <div className='relative grid gap-6 xl:grid-cols-[1fr_360px]'>
          <div className='max-w-3xl'>
            <Badge className='rounded-full border-sky-200 bg-sky-50 px-3 py-1 text-sky-700 hover:bg-sky-50 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300'>
              Personal Career CRM
            </Badge>
            <h2 className='mt-4 text-3xl font-semibold tracking-tight md:text-4xl'>
              Keep every application, interview, and follow-up connected.
            </h2>
            <p className='mt-3 max-w-2xl text-sm text-muted-foreground md:text-base'>
              Your Tapinti workspace is focused on what needs attention now, not
              a generic admin overview.
            </p>
            <div className='mt-6 grid gap-3 sm:grid-cols-3'>
              <div className='rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur'>
                <p className='text-xs font-medium text-muted-foreground'>
                  Active candidates
                </p>
                <p className='mt-2 text-3xl font-semibold'>
                  {data.activeCandidates}
                </p>
              </div>
              <div className='rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur'>
                <p className='text-xs font-medium text-muted-foreground'>
                  Offer rate
                </p>
                <p className='mt-2 text-3xl font-semibold'>{offerRate}%</p>
              </div>
              <div className='rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur'>
                <p className='text-xs font-medium text-muted-foreground'>
                  Companies tracked
                </p>
                <p className='mt-2 text-3xl font-semibold'>
                  {data.totalCompanies}
                </p>
              </div>
            </div>
          </div>

          <Card className='gap-4 rounded-3xl border-sky-200/70 bg-background/80 py-5 shadow-none backdrop-blur dark:border-sky-500/20'>
            <CardHeader className='px-5 pb-0'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <CardTitle className='text-base'>Today’s focus</CardTitle>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Highest-priority job search work
                  </p>
                </div>
                <span className='rounded-full bg-sky-500/10 p-2 text-sky-600 dark:text-sky-300'>
                  <Bell className='size-4' />
                </span>
              </div>
            </CardHeader>
            <CardContent className='space-y-3 px-5'>
              <FocusRow
                icon={Clock}
                label='Follow-ups due'
                value={totalFollowUps}
                tone={overdueFollowUps > 0 ? 'danger' : 'warning'}
              />
              <FocusRow
                icon={CalendarClock}
                label='Next interview'
                value={
                  nextInterview
                    ? format(new Date(nextInterview.interviewDate), 'MMM d')
                    : 'None'
                }
                tone='brand'
              />
              <FocusRow
                icon={CheckCircle2}
                label='Offers received'
                value={data.offersReceived}
                tone='success'
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          title='Active Applications'
          value={data.activeApplications}
          icon={FileText}
          sub={`${data.totalApplications} total applications`}
          accent='brand'
        />
        <StatCard
          title='Upcoming Interviews'
          value={data.upcomingInterviews}
          icon={CalendarClock}
          sub={`${data.totalInterviews} total interviews`}
          accent='success'
        />
        <StatCard
          title='Follow-Ups Today'
          value={data.followUpsDueToday}
          icon={Clock}
          sub='Needs a timely nudge'
          accent='warning'
        />
        <StatCard
          title='Overdue Follow-Ups'
          value={data.followUpsOverdue}
          icon={AlertCircle}
          sub='Recover quiet threads'
          accent={data.followUpsOverdue > 0 ? 'danger' : 'neutral'}
        />
      </div>

      <div className='grid gap-5 xl:grid-cols-[1.45fr_0.9fr]'>
        <Card className='rounded-3xl border-border/70 bg-card/80 shadow-sm shadow-slate-950/5 backdrop-blur'>
          <CardHeader className='pb-0'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <CardTitle>Pipeline health</CardTitle>
                <p className='mt-1 text-sm text-muted-foreground'>
                  A calm board view of the job search system.
                </p>
              </div>
              <Badge variant='outline' className='rounded-full'>
                {data.totalApplications} applications
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid gap-3 md:grid-cols-4'>
              {pipelineStages.map((stage) => (
                <div
                  key={stage.title}
                  className='min-h-44 rounded-2xl border border-border/70 bg-muted/30 p-3'
                >
                  <div className='mb-4 flex items-center justify-between gap-2'>
                    <div className='flex min-w-0 items-center gap-2'>
                      <span className={cn('size-2 rounded-full', stage.dot)} />
                      <p className='truncate text-xs font-semibold tracking-wide text-muted-foreground uppercase'>
                        {stage.title}
                      </p>
                    </div>
                    <span className='text-sm font-semibold'>
                      {stageValue(stage.valueKey)}
                    </span>
                  </div>
                  <div className='rounded-xl border border-border/70 bg-background p-3'>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <p className='text-sm font-medium'>
                          {stage.description}
                        </p>
                        <p className='mt-1 text-xs text-muted-foreground'>
                          {stageValue(stage.valueKey)} items in this lane
                        </p>
                      </div>
                      <ArrowUpRight className='size-4 text-muted-foreground' />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-3xl border-border/70 bg-card/80 shadow-sm shadow-slate-950/5 backdrop-blur'>
          <CardHeader className='pb-0'>
            <CardTitle>Upcoming interviews</CardTitle>
            <p className='mt-1 text-sm text-muted-foreground'>
              Conversations that need preparation.
            </p>
          </CardHeader>
          <CardContent className='space-y-3'>
            {data.upcomingInterviewsList.length === 0 && (
              <EmptyState
                icon={CalendarClock}
                label='No upcoming interviews.'
              />
            )}
            {data.upcomingInterviewsList.slice(0, 5).map((iv) => (
              <div
                key={iv.id}
                className='flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3 text-sm'
              >
                <span className='rounded-xl bg-violet-500/10 p-2 text-violet-600 dark:text-violet-300'>
                  <CalendarClock className='size-4' />
                </span>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <p className='truncate font-medium'>{iv.candidateName}</p>
                    <Badge variant='secondary' className='shrink-0 text-xs'>
                      {iv.round}
                    </Badge>
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {iv.companyName}
                  </p>
                  {iv.jobRoleTitle && (
                    <p className='truncate text-xs text-muted-foreground'>
                      {iv.jobRoleTitle}
                    </p>
                  )}
                </div>
                <span className='shrink-0 text-xs text-muted-foreground'>
                  {format(new Date(iv.interviewDate), 'MMM d, HH:mm')}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className='rounded-3xl border-border/70 bg-card/80 shadow-sm shadow-slate-950/5 backdrop-blur'>
        <CardHeader className='pb-0'>
          <CardTitle>Recent activity</CardTitle>
          <p className='mt-1 text-sm text-muted-foreground'>
            The latest movement across candidates and companies.
          </p>
        </CardHeader>
        <CardContent>
          <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
            {data.recentActivities.length === 0 && (
              <EmptyState icon={CircleDashed} label='No recent activities.' />
            )}
            {data.recentActivities.slice(0, 6).map((a) => (
              <div
                key={a.id}
                className='rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm'
              >
                <div className='mb-3 flex items-center justify-between gap-3'>
                  <Badge variant='outline' className='rounded-full text-xs'>
                    {a.type}
                  </Badge>
                  <span className='text-xs text-muted-foreground'>
                    {format(new Date(a.activityDate), 'MMM d')}
                  </span>
                </div>
                <p className='truncate font-medium'>{a.candidateName}</p>
                {a.companyName && (
                  <p className='mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground'>
                    <Building2 className='size-3' />
                    {a.companyName}
                  </p>
                )}
                {a.notes && (
                  <p className='mt-2 line-clamp-2 text-xs text-muted-foreground'>
                    {a.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FocusRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ElementType
  label: string
  value: number | string
  tone: 'brand' | 'warning' | 'success' | 'danger'
}) {
  const toneClass = {
    brand: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-300',
  }[tone]

  return (
    <div className='flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/30 p-3'>
      <div className='flex items-center gap-3'>
        <span className={cn('rounded-xl p-2', toneClass)}>
          <Icon className='size-4' />
        </span>
        <span className='text-sm font-medium'>{label}</span>
      </div>
      <span className='text-sm font-semibold'>{value}</span>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  label,
}: {
  icon: ElementType
  label: string
}) {
  return (
    <div className='flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 text-sm text-muted-foreground'>
      <div className='flex items-center gap-2'>
        <Icon className='size-4' />
        {label}
      </div>
    </div>
  )
}
