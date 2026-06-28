import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from './api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  FileText,
  Calendar,
  Building2,
  Trophy,
  AlertCircle,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { format } from 'date-fns'

function StatCard({
  title,
  value,
  icon: Icon,
  sub,
  urgent,
}: {
  title: string
  value: number
  icon: React.ElementType
  sub?: string
  urgent?: boolean
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
        <Icon className={`h-4 w-4 ${urgent ? 'text-destructive' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${urgent && value > 0 ? 'text-destructive' : ''}`}>{value}</div>
        {sub && <p className='text-xs text-muted-foreground mt-1'>{sub}</p>}
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
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className='h-28' />
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard title='Active Candidates' value={data.activeCandidates} icon={Users} sub={`${data.totalCandidates} total`} />
        <StatCard title='Active Applications' value={data.activeApplications} icon={FileText} sub={`${data.totalApplications} total`} />
        <StatCard title='Upcoming Interviews' value={data.upcomingInterviews} icon={Calendar} sub={`${data.totalInterviews} total`} />
        <StatCard title='Companies Tracked' value={data.totalCompanies} icon={Building2} />
        <StatCard title='Offers Received' value={data.offersReceived} icon={Trophy} />
        <StatCard title='Follow-Ups Today' value={data.followUpsDueToday} icon={Clock} urgent />
        <StatCard title='Overdue Follow-Ups' value={data.followUpsOverdue} icon={AlertCircle} urgent />
        <StatCard title='Response Rate' value={0} icon={TrendingUp} sub='See Reports page' />
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {data.recentActivities.length === 0 && (
              <p className='text-sm text-muted-foreground'>No recent activities.</p>
            )}
            {data.recentActivities.map((a) => (
              <div key={a.id} className='flex items-start gap-3 text-sm'>
                <Badge variant='outline' className='shrink-0 text-xs'>{a.type}</Badge>
                <div className='min-w-0'>
                  <p className='font-medium truncate'>{a.candidateName}</p>
                  {a.companyName && <p className='text-muted-foreground text-xs'>{a.companyName}</p>}
                  {a.notes && <p className='text-muted-foreground text-xs truncate'>{a.notes}</p>}
                </div>
                <span className='text-xs text-muted-foreground shrink-0 ml-auto'>
                  {format(new Date(a.activityDate), 'MMM d')}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Upcoming Interviews</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {data.upcomingInterviewsList.length === 0 && (
              <p className='text-sm text-muted-foreground'>No upcoming interviews.</p>
            )}
            {data.upcomingInterviewsList.map((iv) => (
              <div key={iv.id} className='flex items-start gap-3 text-sm'>
                <Badge variant='secondary' className='shrink-0 text-xs'>{iv.round}</Badge>
                <div className='min-w-0'>
                  <p className='font-medium truncate'>{iv.candidateName}</p>
                  <p className='text-muted-foreground text-xs'>{iv.companyName}</p>
                  {iv.jobRoleTitle && <p className='text-muted-foreground text-xs truncate'>{iv.jobRoleTitle}</p>}
                </div>
                <span className='text-xs text-muted-foreground shrink-0 ml-auto'>
                  {format(new Date(iv.interviewDate), 'MMM d, HH:mm')}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
