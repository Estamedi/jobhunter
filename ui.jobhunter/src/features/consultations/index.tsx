import { useState } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
import { consultationsApi } from './api'

const PAGE_SIZE = 25

export function Consultations() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['consultation-leads', search, page],
    queryFn: () =>
      consultationsApi.list({
        search: search || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
  })

  return (
    <div className='space-y-4'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Consultations</h2>
        <p className='text-muted-foreground'>
          People who asked for a consultation on the website, newest first.
        </p>
      </div>

      <div className='relative max-w-sm'>
        <Search className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
        <Input
          className='pl-8'
          placeholder='Search by name, email or phone...'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      <div className='overflow-x-auto rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Received</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Message</TableHead>
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
                  No requests yet.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className='text-sm whitespace-nowrap text-muted-foreground'>
                  {format(new Date(lead.created), 'MMM d, yyyy HH:mm')}
                </TableCell>
                <TableCell className='font-medium'>{lead.fullName}</TableCell>
                <TableCell>
                  <a
                    className='text-primary hover:underline'
                    href={`mailto:${lead.email}`}
                  >
                    {lead.email}
                  </a>
                </TableCell>
                <TableCell className='whitespace-nowrap'>
                  {lead.phone ?? '—'}
                </TableCell>
                <TableCell className='uppercase'>{lead.locale ?? '—'}</TableCell>
                <TableCell className='max-w-md whitespace-pre-wrap text-sm text-muted-foreground'>
                  {lead.message ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && (
        <ListPagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.totalCount ?? 0}
          onPageChange={setPage}
          itemLabel='request'
        />
      )}
    </div>
  )
}
