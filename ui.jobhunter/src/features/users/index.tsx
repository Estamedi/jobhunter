import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Search } from 'lucide-react'
import { usersApi } from './api'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ListPagination } from '@/components/list-pagination'

const PAGE_SIZE = 20
const ALL_ROLES = 'all'
const ROLE_OPTIONS = ['Administrator', 'Recruiter', 'JobSeeker']

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className='rounded-lg border p-4'>
      <p className='text-sm text-muted-foreground'>{label}</p>
      {value === undefined ? <Skeleton className='mt-1 h-8 w-16' /> : <p className='text-2xl font-bold'>{value}</p>}
    </div>
  )
}

export function Users() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState(ALL_ROLES)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['registered-users', search, role, page],
    queryFn: () =>
      usersApi.list({
        search: search || undefined,
        role: role === ALL_ROLES ? undefined : role,
        page,
        pageSize: PAGE_SIZE,
      }),
  })

  return (
    <div className='space-y-4'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Registered Users</h2>
        <p className='text-muted-foreground'>Everyone who has signed up for ApplyLadder.</p>
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        <StatCard label='Total users' value={data?.totalUsers} />
        <StatCard label='New this week' value={data?.newThisWeek} />
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative max-w-sm flex-1'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            className='pl-8'
            placeholder='Search by email...'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          value={role}
          onValueChange={(v) => {
            setRole(v)
            setPage(1)
          }}
        >
          <SelectTrigger className='w-44'>
            <SelectValue placeholder='All roles' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ROLES}>All roles</SelectItem>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='overflow-x-auto rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Onboarding</TableHead>
              <TableHead>Sign-in</TableHead>
              <TableHead>Email confirmed</TableHead>
              <TableHead>Registered</TableHead>
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
                <TableCell colSpan={6} className='py-8 text-center text-muted-foreground'>
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((u) => (
              <TableRow key={u.id}>
                <TableCell className='font-medium'>{u.email}</TableCell>
                <TableCell>
                  <div className='flex flex-wrap gap-1'>
                    {u.roles.map((r) => (
                      <Badge key={r} variant={r === 'Administrator' ? 'default' : 'secondary'}>
                        {r}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant='outline'>{u.onboardingStatus}</Badge>
                </TableCell>
                <TableCell className='text-sm'>
                  {[u.hasPassword && 'Password', u.usesGoogle && 'Google'].filter(Boolean).join(' + ') || '—'}
                </TableCell>
                <TableCell className='text-sm'>{u.emailConfirmed ? 'Yes' : 'No'}</TableCell>
                <TableCell className='text-sm text-muted-foreground'>
                  {u.created ? format(new Date(u.created), 'MMM d, yyyy') : 'Unknown'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && (
        <ListPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} itemLabel='user' />
      )}
    </div>
  )
}
