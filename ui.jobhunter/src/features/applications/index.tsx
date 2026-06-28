import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi, type JobApplication, type CreateApplicationDto } from './api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Search, Trash2, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Wishlist: 'outline',
  Applied: 'secondary',
  PhoneScreen: 'default',
  HRInterview: 'default',
  TechnicalInterview: 'default',
  FinalInterview: 'default',
  Offer: 'default',
  Accepted: 'default',
  Rejected: 'destructive',
  Withdrawn: 'secondary',
  Ghosted: 'secondary',
}

const FOLLOWUP_COLORS: Record<string, string> = {
  Overdue: 'text-destructive font-medium',
  DueToday: 'text-orange-500 font-medium',
  ThisWeek: 'text-yellow-600',
}

const STATUSES = ['Wishlist', 'Applied', 'PhoneScreen', 'HRInterview', 'TechnicalInterview', 'FinalInterview', 'Offer', 'Accepted', 'Rejected', 'Withdrawn', 'Ghosted']

function ApplicationForm({ defaultValues, onSubmit }: { defaultValues?: Partial<CreateApplicationDto>; onSubmit: (d: CreateApplicationDto) => void }) {
  const { register, handleSubmit } = useForm<CreateApplicationDto>({ defaultValues })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4' id='app-form'>
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1'>
          <Label>Candidate ID *</Label>
          <Input type='number' {...register('candidateId', { valueAsNumber: true })} required />
        </div>
        <div className='space-y-1'>
          <Label>Job Role ID *</Label>
          <Input type='number' {...register('jobRoleId', { valueAsNumber: true })} required />
        </div>
        <div className='space-y-1'>
          <Label>Company ID *</Label>
          <Input type='number' {...register('companyId', { valueAsNumber: true })} required />
        </div>
        <div className='space-y-1'>
          <Label>Main Contact ID</Label>
          <Input type='number' {...register('mainContactId', { valueAsNumber: true })} />
        </div>
        <div className='space-y-1'>
          <Label>Status</Label>
          <select {...register('status')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm'>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/([A-Z])/g, ' $1').trim()}</option>)}
          </select>
        </div>
        <div className='space-y-1'>
          <Label>Priority</Label>
          <select {...register('priority')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm'>
            {['Low', 'Medium', 'High'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className='space-y-1'>
          <Label>Applied Date</Label>
          <Input type='date' {...register('appliedDate')} />
        </div>
        <div className='space-y-1'>
          <Label>Next Follow-Up</Label>
          <Input type='date' {...register('nextFollowUpDate')} />
        </div>
        <div className='space-y-1'>
          <Label>Expected Salary</Label>
          <Input type='number' {...register('expectedSalary', { valueAsNumber: true })} />
        </div>
        <div className='space-y-1'>
          <Label>Currency</Label>
          <Input {...register('currency')} placeholder='USD' />
        </div>
        <div className='space-y-1'>
          <Label>Resume Version</Label>
          <Input {...register('resumeVersion')} placeholder='v1, tailored-stripe' />
        </div>
        <div className='space-y-1'>
          <Label>Cover Letter Version</Label>
          <Input {...register('coverLetterVersion')} />
        </div>
      </div>
      <div className='space-y-1'>
        <Label>Notes</Label>
        <Textarea {...register('notes')} rows={3} />
      </div>
    </form>
  )
}

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
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/([A-Z])/g, ' $1').trim()}</option>)}
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
              <TableHead className='w-10' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={8}><Skeleton className='h-8 w-full' /></TableCell></TableRow>}
            {!isLoading && data?.items.length === 0 && (
              <TableRow><TableCell colSpan={8} className='text-center text-muted-foreground py-8'>No applications found.</TableCell></TableRow>
            )}
            {data?.items.map((a) => (
              <TableRow key={a.id}>
                <TableCell className='font-medium text-sm'>{a.candidateName || `#${a.candidateId}`}</TableCell>
                <TableCell className='text-sm'>{a.companyName || `#${a.companyId}`}</TableCell>
                <TableCell className='text-sm max-w-[150px] truncate'>{a.jobRoleTitle || `#${a.jobRoleId}`}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_COLORS[a.status] ?? 'secondary'} className='text-xs whitespace-nowrap'>
                    {a.status.replace(/([A-Z])/g, ' $1').trim()}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader><DialogTitle>{editing ? 'Edit Application' : 'Add Application'}</DialogTitle></DialogHeader>
          <ApplicationForm
            defaultValues={editing ? {
              candidateId: editing.candidateId,
              jobRoleId: editing.jobRoleId,
              companyId: editing.companyId,
              mainContactId: editing.mainContactId,
              status: editing.status,
              priority: editing.priority,
              appliedDate: editing.appliedDate?.split('T')[0],
              nextFollowUpDate: editing.nextFollowUpDate?.split('T')[0],
              expectedSalary: editing.expectedSalary,
              currency: editing.currency,
              resumeVersion: editing.resumeVersion,
              coverLetterVersion: editing.coverLetterVersion,
              notes: editing.notes,
            } : undefined}
            onSubmit={handleSubmit}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type='submit' form='app-form' disabled={isBusy}>{editing ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
