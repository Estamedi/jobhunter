import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi, type JobApplication, type CreateApplicationDto } from './api'
import { candidatesApi } from '@/features/candidates/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Search, Trash2, Pencil, Download, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ApplicationsMutateDialog } from './components/applications-mutate-dialog'
import { STATUS_COLORS, FOLLOWUP_COLORS, STATUSES, formatStatusLabel } from './data/constants'
import { downloadCvFile } from '@/features/cvs/lib/cv-file'

export function Applications() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<JobApplication | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['applications', search, statusFilter],
    queryFn: () => applicationsApi.list({ search: search || undefined, status: statusFilter }),
  })

  const { data: myCandidate } = useQuery({
    queryKey: ['candidates', 'me'],
    queryFn: () => candidatesApi.list({ pageSize: 1 }),
  })
  const candidateId = myCandidate?.items[0]?.id

  const create = useMutation({
    mutationFn: applicationsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); toast.success('Application created'); setDialogOpen(false) },
  })

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<CreateApplicationDto> }) => applicationsApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); toast.success('Application updated'); setDialogOpen(false) },
  })

  const remove = useMutation({
    mutationFn: applicationsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); toast.success('Application deleted') },
  })

  function handleSubmit(dto: CreateApplicationDto) {
    if (editing) update.mutate({ id: editing.id, dto })
    else create.mutate(dto)
  }

  const isBusy = create.isPending || update.isPending

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative flex-1 min-w-[200px] max-w-sm'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Search applications...' className='pl-8' value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select
          value={statusFilter ?? ''}
          onChange={(e) => setStatusFilter(e.target.value || undefined)}
          className='flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm'
        >
          <option value=''>All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{formatStatusLabel(s)}</option>)}
        </select>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }} className='ml-auto'>
          <Plus className='h-4 w-4 mr-1' /> Add Application
        </Button>
      </div>

      <div className='rounded-md border overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Follow-Up</TableHead>
              <TableHead>Resume</TableHead>
              <TableHead className='w-10' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={9}><Skeleton className='h-8 w-full' /></TableCell></TableRow>}
            {!isLoading && data?.items.length === 0 && (
              <TableRow><TableCell colSpan={9} className='text-center text-muted-foreground py-8'>No applications found.</TableCell></TableRow>
            )}
            {data?.items.map((a) => (
              <TableRow key={a.id}>
                <TableCell className='font-medium text-sm'>{a.candidateName || `#${a.candidateId}`}</TableCell>
                <TableCell className='text-sm'>{a.companyName || `#${a.companyId}`}</TableCell>
                <TableCell className='text-sm max-w-[150px] truncate'>{a.jobRoleTitle || `#${a.jobRoleId}`}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_COLORS[a.status] ?? 'secondary'} className='text-xs whitespace-nowrap'>
                    {formatStatusLabel(a.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={a.priority === 'High' ? 'destructive' : a.priority === 'Medium' ? 'default' : 'secondary'} className='text-xs'>
                    {a.priority}
                  </Badge>
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>
                  {a.appliedDate ? format(new Date(a.appliedDate), 'MMM d, yyyy') : '—'}
                </TableCell>
                <TableCell>
                  {a.nextFollowUpDate ? (
                    <span className={`text-sm ${FOLLOWUP_COLORS[a.followUpStatus ?? ''] ?? 'text-muted-foreground'}`}>
                      {format(new Date(a.nextFollowUpDate), 'MMM d')}
                      {a.followUpStatus && a.followUpStatus !== 'NotNeeded' && (
                        <span className='ml-1 text-xs'>({a.followUpStatus})</span>
                      )}
                    </span>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  {a.cvId && a.cvFileName ? (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 max-w-[140px] justify-start gap-1 px-2 text-sm'
                      title={a.cvFileName}
                      onClick={() => downloadCvFile({ id: a.cvId!, fileName: a.cvFileName! })}
                    >
                      <FileText className='h-4 w-4 shrink-0 text-muted-foreground' />
                      <span className='truncate'>{a.cvFileName}</span>
                      <Download className='h-3 w-3 shrink-0 text-muted-foreground' />
                    </Button>
                  ) : (
                    <span className='text-sm text-muted-foreground'>—</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='h-8 w-8'><MoreHorizontal className='h-4 w-4' /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => { setEditing(a); setDialogOpen(true) }}><Pencil className='h-4 w-4 mr-2' /> Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className='text-destructive' onClick={() => remove.mutate(a.id)}><Trash2 className='h-4 w-4 mr-2' /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ApplicationsMutateDialog
        key={editing?.id ?? 'create'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentRow={editing}
        candidateId={candidateId}
        isPending={isBusy}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
