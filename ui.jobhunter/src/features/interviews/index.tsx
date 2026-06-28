import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { interviewsApi, type JobInterview, type CreateInterviewDto } from './api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Trash2, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  Scheduled: 'default',
  Completed: 'secondary',
  Cancelled: 'destructive',
  Rescheduled: 'default',
  NoShow: 'destructive',
}

const ROUNDS = ['HR', 'Technical', 'System Design', 'Manager', 'Director', 'CEO', 'Panel', 'Final', 'Other']

function InterviewForm({ defaultValues, onSubmit }: { defaultValues?: Partial<CreateInterviewDto>; onSubmit: (d: CreateInterviewDto) => void }) {
  const { register, handleSubmit } = useForm<CreateInterviewDto>({ defaultValues })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4' id='interview-form'>
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1'>
          <Label>Application ID *</Label>
          <Input type='number' {...register('applicationId', { valueAsNumber: true })} required />
        </div>
        <div className='space-y-1'>
          <Label>Candidate ID *</Label>
          <Input type='number' {...register('candidateId', { valueAsNumber: true })} required />
        </div>
        <div className='space-y-1'>
          <Label>Company ID *</Label>
          <Input type='number' {...register('companyId', { valueAsNumber: true })} required />
        </div>
        <div className='space-y-1'>
          <Label>Round</Label>
          <select {...register('round')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm'>
            {ROUNDS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className='space-y-1'>
          <Label>Interview Date *</Label>
          <Input type='datetime-local' {...register('interviewDate')} required />
        </div>
        <div className='space-y-1'>
          <Label>Duration (min)</Label>
          <Input type='number' {...register('durationMinutes', { valueAsNumber: true })} placeholder='60' />
        </div>
        <div className='space-y-1'>
          <Label>Interviewer Name</Label>
          <Input {...register('interviewerName')} />
        </div>
        <div className='space-y-1'>
          <Label>Interviewer Email</Label>
          <Input type='email' {...register('interviewerEmail')} />
        </div>
        <div className='space-y-1 col-span-2'>
          <Label>Meeting Link</Label>
          <Input {...register('meetingLink')} placeholder='https://meet.google.com/...' />
        </div>
        <div className='space-y-1'>
          <Label>Status</Label>
          <select {...register('status')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm'>
            {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className='space-y-1'>
        <Label>Preparation Notes</Label>
        <Textarea {...register('preparationNotes')} rows={3} />
      </div>
    </form>
  )
}

function InterviewTable({ interviews, isLoading, onEdit, onDelete }: {
  interviews?: JobInterview[]
  isLoading: boolean
  onEdit: (i: JobInterview) => void
  onDelete: (id: number) => void
}) {
  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Candidate</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Round</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Interviewer</TableHead>
            <TableHead className='w-10' />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableRow><TableCell colSpan={8}><Skeleton className='h-8 w-full' /></TableCell></TableRow>}
          {!isLoading && (!interviews || interviews.length === 0) && (
            <TableRow><TableCell colSpan={8} className='text-center text-muted-foreground py-8'>No interviews found.</TableCell></TableRow>
          )}
          {interviews?.map((iv) => (
            <TableRow key={iv.id}>
              <TableCell className='text-sm whitespace-nowrap'>{format(new Date(iv.interviewDate), 'MMM d, HH:mm')}</TableCell>
              <TableCell className='text-sm font-medium'>{iv.candidateName || `#${iv.candidateId}`}</TableCell>
              <TableCell className='text-sm'>{iv.companyName || `#${iv.companyId}`}</TableCell>
              <TableCell className='text-sm truncate max-w-[150px]'>{iv.jobRoleTitle || '—'}</TableCell>
              <TableCell><Badge variant='outline' className='text-xs'>{iv.round}</Badge></TableCell>
              <TableCell><Badge variant={STATUS_COLORS[iv.status] ?? 'secondary'} className='text-xs'>{iv.status}</Badge></TableCell>
              <TableCell className='text-sm'>{iv.interviewerName || '—'}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' className='h-8 w-8'><MoreHorizontal className='h-4 w-4' /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => onEdit(iv)}><Pencil className='h-4 w-4 mr-2' /> Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className='text-destructive' onClick={() => onDelete(iv.id)}><Trash2 className='h-4 w-4 mr-2' /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function Interviews() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<JobInterview | null>(null)

  const { data: all, isLoading: l1 } = useQuery({ queryKey: ['interviews'], queryFn: () => interviewsApi.list() })
  const { data: upcoming, isLoading: l2 } = useQuery({ queryKey: ['interviews', 'upcoming'], queryFn: interviewsApi.upcoming })

  const create = useMutation({
    mutationFn: interviewsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interviews'] }); toast.success('Interview scheduled'); setDialogOpen(false) },
  })

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<CreateInterviewDto> }) => interviewsApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interviews'] }); toast.success('Interview updated'); setDialogOpen(false) },
  })

  const remove = useMutation({
    mutationFn: interviewsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interviews'] }); toast.success('Interview deleted') },
  })

  function handleSubmit(dto: CreateInterviewDto) {
    if (editing) update.mutate({ id: editing.id, dto })
    else create.mutate(dto)
  }

  function handleEdit(iv: JobInterview) {
    setEditing(iv)
    setDialogOpen(true)
  }

  const isBusy = create.isPending || update.isPending

  return (
    <div className='space-y-4'>
      <div className='flex items-center'>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }} className='ml-auto'>
          <Plus className='h-4 w-4 mr-1' /> Schedule Interview
        </Button>
      </div>

      <Tabs defaultValue='upcoming'>
        <TabsList>
          <TabsTrigger value='upcoming'>Upcoming ({upcoming?.total ?? 0})</TabsTrigger>
          <TabsTrigger value='all'>All ({all?.total ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value='upcoming' className='mt-4'>
          <InterviewTable interviews={upcoming?.items} isLoading={l2} onEdit={handleEdit} onDelete={(id) => remove.mutate(id)} />
        </TabsContent>
        <TabsContent value='all' className='mt-4'>
          <InterviewTable interviews={all?.items} isLoading={l1} onEdit={handleEdit} onDelete={(id) => remove.mutate(id)} />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
          <DialogHeader><DialogTitle>{editing ? 'Edit Interview' : 'Schedule Interview'}</DialogTitle></DialogHeader>
          <InterviewForm
            defaultValues={editing ? {
              applicationId: editing.applicationId,
              candidateId: editing.candidateId,
              companyId: editing.companyId,
              round: editing.round,
              interviewDate: editing.interviewDate?.replace('Z', '').replace('+00:00', '').substring(0, 16),
              durationMinutes: editing.durationMinutes,
              interviewerName: editing.interviewerName,
              interviewerEmail: editing.interviewerEmail,
              meetingLink: editing.meetingLink,
              status: editing.status,
              preparationNotes: editing.preparationNotes,
            } : undefined}
            onSubmit={handleSubmit}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type='submit' form='interview-form' disabled={isBusy}>{editing ? 'Save Changes' : 'Schedule'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
