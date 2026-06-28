import { useQuery } from '@tanstack/react-query'
import { applicationsApi, type JobApplication } from '@/features/applications/api'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

function FollowUpTable({ applications, isLoading }: { applications?: JobApplication[]; isLoading: boolean }) {
  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Candidate</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Follow-Up Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableRow><TableCell colSpan={5}><Skeleton className='h-8 w-full' /></TableCell></TableRow>}
          {!isLoading && (!applications || applications.length === 0) && (
            <TableRow><TableCell colSpan={5} className='text-center text-muted-foreground py-8'>No follow-ups.</TableCell></TableRow>
          )}
          {applications?.map((a) => (
            <TableRow key={a.id}>
              <TableCell className='font-medium text-sm'>{a.candidateName || `#${a.candidateId}`}</TableCell>
              <TableCell className='text-sm'>{a.companyName || `#${a.companyId}`}</TableCell>
              <TableCell className='text-sm truncate max-w-[180px]'>{a.jobRoleTitle || `#${a.jobRoleId}`}</TableCell>
              <TableCell><Badge variant='secondary' className='text-xs'>{a.status.replace(/([A-Z])/g, ' $1').trim()}</Badge></TableCell>
              <TableCell className='text-sm font-medium'>
                {a.nextFollowUpDate ? format(new Date(a.nextFollowUpDate), 'MMM d, yyyy') : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function FollowUps() {
  const { data: today, isLoading: l1 } = useQuery({ queryKey: ['follow-ups', 'today'], queryFn: applicationsApi.followUpsToday })
  const { data: overdue, isLoading: l2 } = useQuery({ queryKey: ['follow-ups', 'overdue'], queryFn: applicationsApi.followUpsOverdue })
  const { data: week, isLoading: l3 } = useQuery({ queryKey: ['follow-ups', 'week'], queryFn: applicationsApi.followUpsThisWeek })

  return (
    <Tabs defaultValue='overdue'>
      <TabsList>
        <TabsTrigger value='overdue'>
          Overdue {!l2 && overdue && overdue.total > 0 && <Badge variant='destructive' className='ml-1 text-xs'>{overdue.total}</Badge>}
        </TabsTrigger>
        <TabsTrigger value='today'>
          Due Today {!l1 && today && today.total > 0 && <Badge variant='default' className='ml-1 text-xs'>{today.total}</Badge>}
        </TabsTrigger>
        <TabsTrigger value='week'>
          This Week {!l3 && week && week.total > 0 && <Badge variant='secondary' className='ml-1 text-xs'>{week.total}</Badge>}
        </TabsTrigger>
      </TabsList>
      <TabsContent value='overdue' className='mt-4'>
        <FollowUpTable applications={overdue?.items} isLoading={l2} />
      </TabsContent>
      <TabsContent value='today' className='mt-4'>
        <FollowUpTable applications={today?.items} isLoading={l1} />
      </TabsContent>
      <TabsContent value='week' className='mt-4'>
        <FollowUpTable applications={week?.items} isLoading={l3} />
      </TabsContent>
    </Tabs>
  )
}
