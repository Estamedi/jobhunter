import { Fragment, useState } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ListPagination } from '@/components/list-pagination'
import { auditLogsApi } from './api'

const PAGE_SIZE = 25
const ALL = 'all'

// The error is JSON (field -> reasons) for a validation failure, else a plain message.
function explainError(error: string | null) {
  if (!error) return null
  try {
    const parsed = JSON.parse(error) as Record<string, string[]>
    return Object.entries(parsed)
      .map(([field, reasons]) => `${field}: ${reasons.join(' ')}`)
      .join('\n')
  } catch {
    return error
  }
}

export function AuditLogs() {
  const [search, setSearch] = useState('')
  const [result, setResult] = useState(ALL)
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', search, result, page],
    queryFn: () =>
      auditLogsApi.list({
        search: search || undefined,
        succeeded: result === ALL ? undefined : result === 'ok',
        page,
        pageSize: PAGE_SIZE,
      }),
  })

  return (
    <div className='space-y-4'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Audit log</h2>
        <p className='text-muted-foreground'>
          Who did what: every change users make and every sign-in, whether it
          worked, and why not.
        </p>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative max-w-sm flex-1'>
          <Search className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            className='pl-8'
            placeholder='Search by email or action...'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          value={result}
          onValueChange={(v) => {
            setResult(v)
            setPage(1)
          }}
        >
          <SelectTrigger className='w-44'>
            <SelectValue placeholder='All results' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All results</SelectItem>
            <SelectItem value='ok'>Succeeded</SelectItem>
            <SelectItem value='failed'>Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='overflow-x-auto rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-8' />
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Skeleton className='h-8 w-full' />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='py-8 text-center text-muted-foreground'
                >
                  No entries found.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((log) => {
              const isOpen = open === log.id
              const error = explainError(log.error)
              return (
                <Fragment key={log.id}>
                  <TableRow
                    className='cursor-pointer'
                    onClick={() => setOpen(isOpen ? null : log.id)}
                  >
                    <TableCell>
                      {isOpen ? (
                        <ChevronDown className='h-4 w-4' />
                      ) : (
                        <ChevronRight className='h-4 w-4' />
                      )}
                    </TableCell>
                    <TableCell className='text-sm whitespace-nowrap text-muted-foreground'>
                      {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell className='font-medium'>
                      {log.userEmail ?? 'System'}
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>
                      <Badge
                        variant={log.succeeded ? 'secondary' : 'destructive'}
                      >
                        {log.succeeded ? 'Succeeded' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {log.durationMs} ms
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow>
                      <TableCell />
                      <TableCell colSpan={5} className='space-y-2 text-sm'>
                        {error && (
                          <div>
                            <p className='font-medium'>Why it failed</p>
                            <pre className='whitespace-pre-wrap text-destructive'>
                              {error}
                            </pre>
                          </div>
                        )}
                        <div>
                          <p className='font-medium'>Data sent</p>
                          <pre className='break-all whitespace-pre-wrap text-muted-foreground'>
                            {log.payload ?? 'None'}
                          </pre>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {!isLoading && (
        <ListPagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.totalCount ?? 0}
          onPageChange={setPage}
          itemLabel='entry'
        />
      )}
    </div>
  )
}
