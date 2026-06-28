import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/features/crm-dashboard/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B']

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base'>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function Reports() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'reports'],
    queryFn: dashboardApi.reports,
  })

  if (isLoading) return <div className='grid gap-4 md:grid-cols-2'>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className='h-64' />)}</div>
  if (!data) return null

  const byStatus = Object.entries(data.applicationsByStatus).map(([name, value]) => ({ name: name.replace(/([A-Z])/g, ' $1').trim(), value }))
  const byCandidate = Object.entries(data.applicationsByCandidate).map(([name, value]) => ({ name, value }))
  const byWorkType = Object.entries(data.applicationsByWorkType).map(([name, value]) => ({ name, value }))
  const monthlyTrend = data.monthlyApplicationTrend.map((m) => ({ month: m.month, Applications: m.count }))

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'><CardTitle className='text-sm font-medium text-muted-foreground'>Response Rate</CardTitle></CardHeader>
          <CardContent><div className='text-2xl font-bold'>{data.responseRate.toFixed(1)}%</div><p className='text-xs text-muted-foreground'>Applications that reached interview stage</p></CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'><CardTitle className='text-sm font-medium text-muted-foreground'>Interview Conversion</CardTitle></CardHeader>
          <CardContent><div className='text-2xl font-bold'>{data.interviewConversionRate.toFixed(1)}%</div><p className='text-xs text-muted-foreground'>Interviews that led to offers</p></CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'><CardTitle className='text-sm font-medium text-muted-foreground'>Offer Rate</CardTitle></CardHeader>
          <CardContent><div className='text-2xl font-bold'>{data.offerRate.toFixed(1)}%</div><p className='text-xs text-muted-foreground'>Applications that resulted in offers</p></CardContent>
        </Card>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <ChartCard title='Monthly Application Trend'>
          <ResponsiveContainer width='100%' height={220}>
            <BarChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' className='opacity-30' />
              <XAxis dataKey='month' tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey='Applications' fill='hsl(var(--primary))' radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title='Applications by Status'>
          <ResponsiveContainer width='100%' height={220}>
            <PieChart>
              <Pie data={byStatus} cx='50%' cy='50%' outerRadius={80} dataKey='value' label={(entry: any) => `${entry.name} ${(((entry.percent) ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title='Applications by Candidate'>
          <ResponsiveContainer width='100%' height={220}>
            <BarChart data={byCandidate} layout='vertical' margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' className='opacity-30' />
              <XAxis type='number' tick={{ fontSize: 11 }} />
              <YAxis type='category' dataKey='name' tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey='value' fill='hsl(var(--primary))' radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title='Applications by Work Type'>
          <ResponsiveContainer width='100%' height={220}>
            <PieChart>
              <Pie data={byWorkType} cx='50%' cy='50%' outerRadius={80} dataKey='value'>
                {byWorkType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
