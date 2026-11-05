import { useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Play, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ListPagination } from '@/components/list-pagination'
import { type JobState, workersApi } from './api'

const PAGE_SIZE = 15
const REFRESH_MS = 5000
const STATES: JobState[] = [
  'Failed',
  'Processing',
  'Enqueued',
  'Scheduled',
  'Succeeded',
  'Deleted',
]

function when(value: string | null) {
  return value ? format(new Date(value), 'MMM d, HH:mm:ss') : '-'
}

function ago(value: string | null) {
  return value ? formatDistanceToNow(new Date(value), { addSuffix: true }) : '-'
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'bad'
}) {
  return (
    <Card>
      <CardHeader className='pb-1'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={`text-2xl font-bold ${tone === 'bad' && value > 0 ? 'text-destructive' : ''}`}
        >
          {value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  )
}

function useJobAction(run: (id: string) => Promise<unknown>, done: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      toast.success(done)
      void queryClient.invalidateQueries({ queryKey: ['workers'] })
    },
    onError: () => toast.error('That did not work. Try again.'),
  })
}

export function Workers() {
  const [state, setState] = useState<JobState>('Failed')
  const [page, setPage] = useState(1)

  const overview = useQuery({
    queryKey: ['workers', 'overview'],
    queryFn: workersApi.overview,
    refetchInterval: REFRESH_MS,
  })
  const jobs = useQuery({
    queryKey: ['workers', 'jobs', state, page],
    queryFn: () => workersApi.jobs(state, page, PAGE_SIZE),
    refetchInterval: REFRESH_MS,
  })

  const requeue = useJobAction(workersApi.requeue, 'Job queued again')
  const remove = useJobAction(workersApi.remove, 'Job deleted')
  const trigger = useJobAction(workersApi.trigger, 'Poll started')

  const stats = overview.data?.stats
  const online = overview.data?.servers.length ?? 0

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Workers</h2>
        <p className='text-muted-foreground'>
          The background jobs: CV writing, CV reading, S3 uploads and email.
          Refreshes every few seconds. What each job did is in the Audit log.
        </p>
      </div>

      {online === 0 && !overview.isLoading && (
        <div className='rounded-md border border-destructive p-3 text-sm text-destructive'>
          No worker server is running, so nothing is being processed.
        </div>
      )}

      <div className='grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6'>
        {overview.isLoading || !stats ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className='h-20 w-full' />
          ))
        ) : (
          <>
            <Stat label='Waiting' value={stats.enqueued} />
            <Stat label='Running now' value={stats.processing} />
            <Stat label='Scheduled' value={stats.scheduled} />
            <Stat label='Failed' value={stats.failed} tone='bad' />
            <Stat label='Succeeded' value={stats.succeeded} />
            <Stat label='Servers' value={stats.servers} />
          </>
        )}
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Queues</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Queue</TableHead>
                  <TableHead className='text-right'>Waiting</TableHead>
                  <TableHead className='text-right'>Taken</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.data?.queues.map((q) => (
                  <TableRow key={q.name}>
                    <TableCell className='font-medium'>{q.name}</TableCell>
                    <TableCell className='text-right'>{q.length}</TableCell>
                    <TableCell className='text-right'>{q.fetched}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Items in each queue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.data?.workItems.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className='text-center text-muted-foreground'
                    >
                      Nothing yet.
                    </TableCell>
                  </TableRow>
                )}
                {overview.data?.workItems.map((w) => (
                  <TableRow key={`${w.queue}-${w.status}`}>
                    <TableCell className='font-medium'>{w.queue}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          w.status === 'Failed' ? 'destructive' : 'secondary'
                        }
                      >
                        {w.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>{w.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Servers</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Server</TableHead>
                <TableHead>Workers</TableHead>
                <TableHead>Queues</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Last heartbeat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.data?.servers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className='text-center text-muted-foreground'
                  >
                    No server is running.
                  </TableCell>
                </TableRow>
              )}
              {overview.data?.servers.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className='font-medium'>{s.name}</TableCell>
                  <TableCell>{s.workerCount}</TableCell>
                  <TableCell>{s.queues.join(', ')}</TableCell>
                  <TableCell>{ago(s.startedAt)}</TableCell>
                  <TableCell>{ago(s.heartbeat)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Recurring polls</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Poll</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last run</TableHead>
                <TableHead>Next run</TableHead>
                <TableHead>Last result</TableHead>
                <TableHead className='w-24' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.data?.recurring.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className='font-medium'>{r.id}</p>
                    <p className='text-xs text-muted-foreground'>{r.name}</p>
                  </TableCell>
                  <TableCell className='font-mono text-xs'>{r.cron}</TableCell>
                  <TableCell>{ago(r.lastExecution)}</TableCell>
                  <TableCell>{when(r.nextExecution)}</TableCell>
                  <TableCell>
                    {r.lastJobState && (
                      <Badge
                        variant={
                          r.lastJobState === 'Failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {r.lastJobState}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size='sm'
                      variant='outline'
                      disabled={trigger.isPending}
                      onClick={() => trigger.mutate(r.id)}
                    >
                      <Play className='mr-1 h-3 w-3' /> Run now
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className='space-y-3'>
        <h3 className='text-lg font-semibold'>Jobs</h3>
        <Tabs
          value={state}
          onValueChange={(v) => {
            setState(v as JobState)
            setPage(1)
          }}
        >
          <TabsList>
            {STATES.map((s) => (
              <TabsTrigger key={s} value={s}>
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className='overflow-x-auto rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Queue</TableHead>
                <TableHead>Since</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead className='w-40' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.isLoading && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className='h-8 w-full' />
                  </TableCell>
                </TableRow>
              )}
              {!jobs.isLoading && jobs.data?.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className='py-8 text-center text-muted-foreground'
                  >
                    No {state.toLowerCase()} jobs.
                  </TableCell>
                </TableRow>
              )}
              {jobs.data?.items.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>
                    <p className='font-medium'>{j.name}</p>
                    <p className='text-xs text-muted-foreground'>#{j.id}</p>
                  </TableCell>
                  <TableCell>{j.queue}</TableCell>
                  <TableCell className='whitespace-nowrap text-sm text-muted-foreground'>
                    {when(j.since)}
                  </TableCell>
                  <TableCell className='max-w-md text-sm'>
                    {j.error && (
                      <p className='break-words text-destructive'>{j.error}</p>
                    )}
                    {j.server && (
                      <p className='text-muted-foreground'>on {j.server}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className='flex gap-1'>
                      {state !== 'Processing' && (
                        <Button
                          size='sm'
                          variant='outline'
                          disabled={requeue.isPending}
                          onClick={() => requeue.mutate(j.id)}
                        >
                          <RotateCcw className='mr-1 h-3 w-3' /> Retry
                        </Button>
                      )}
                      {state !== 'Deleted' && state !== 'Succeeded' && (
                        <Button
                          size='sm'
                          variant='outline'
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(j.id)}
                        >
                          <Trash2 className='h-3 w-3' />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {!jobs.isLoading && (
          <ListPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={jobs.data?.totalCount ?? 0}
            onPageChange={setPage}
            itemLabel='job'
          />
        )}
      </div>
    </div>
  )
}
