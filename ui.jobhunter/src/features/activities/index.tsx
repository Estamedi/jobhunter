import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { activitiesApi, type JobActivity, type CreateActivityDto } from './api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Trash2, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'

const TYPES = ['Note', 'Email', 'Call', 'Meeting', 'NetworkingEvent', 'Referral', 'ApplicationSubmitted', 'FollowUp', 'Other']

function ActivityForm({ defaultValues, onSubmit }: { defaultValues?: Partial<CreateActivityDto>; onSubmit: (d: CreateActivityDto) => void }) {
  const { register, handleSubmit } = useForm<CreateActivityDto>({ defaultValues })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4' id='activity-form'>
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1'>
          <Label>Candidate ID *</Label>
          <Input type='number' {...register('candidateId', { valueAsNumber: true })} required />
        </div>
        <div className='space-y-1'>
          <Label>Type</Label>
          <select {...register('type')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm'>
            {TYPES.map((t) => <option key={t} value={t}>{t.replace(/([A-Z])/g, ' $1').trim()}</option>)}
          </select>
        </div>
        <div className='space-y-1'>
          <Label>Application ID</Label>
          <Input type='number' {...register('applicationId', { valueAsNumber: true })} />
        </div>
        <div className='space-y-1'>
          <Label>Company ID</Label>
          <Input type='number' {...register('companyId', { valueAsNumber: true })} />
        </div>
        <div className='space-y-1'>
          <Label>Contact ID</Label>
          <Input type='number' {...register('contactId', { valueAsNumber: true })} />
        </div>
        <div className='space-y-1'>
          <Label>Date</Label>
          <Input type='datetime-local' {...register('activityDate')} />
        </div>
        <div className='space-y-1'>
          <Label>Outcome</Label>
          <Input {...register('outcome')} />
        </div>
      </div>
      <div className='space-y-1'>
        <Label>Notes</Label>
        <Textarea {...register('notes')} rows={3} />
      </div>
    </form>
  )
}

export function Activities() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<JobActivity | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.list({ pageSize: 100 }),
  })

  const create = useMutation({
    mutationFn: activitiesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); toast.success('Activity logged'); setDialogOpen(false) },
  })

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<CreateActivityDto> }) => activitiesApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); toast.success('Activity updated'); setDialogOpen(false) },
  })

  const remove = useMutation({
    mutationFn: activitiesApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); toast.success('Activity deleted') },
  })

  function handleSubmit(dto: CreateActivityDto) {
    if (editing) update.mutate({ id: editing.id, dto })
    else create.mutate(dto)
  }

  const isBusy = create.isPending || update.isPending

  return (
    <div className='space-y-4'>
      <div className='flex items-center'>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }} className='ml-auto'>
          <Plus className='h-4 w-4 mr-1' /> Log Activity
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className='w-10' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7}><Skeleton className='h-8 w-full' /></TableCell></TableRow>}
            {!isLoading && data?.items.length === 0 && (
              <TableRow><TableCell colSpan={7} className='text-center text-muted-foreground py-8'>No activities logged.</TableCell></TableRow>
            )}
            {data?.items.map((a) => (
              <TableRow key={a.id}>
                <TableCell className='text-sm whitespace-nowrap'>{format(new Date(a.activityDate), 'MMM d, HH:mm')}</TableCell>
                <TableCell><Badge variant='outline' className='text-xs'>{a.type}</Badge></TableCell>
                <TableCell className='text-sm'>{a.candidateName || `#${a.candidateId}`}</TableCell>
                <TableCell className='text-sm'>{a.companyName || '—'}</TableCell>
                <TableCell className='text-sm'>{a.outcome || '—'}</TableCell>
                <TableCell className='text-sm text-muted-foreground max-w-[200px] truncate'>{a.notes || '—'}</TableCell>
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
        <DialogContent className='max-w-lg'>
          <DialogHeader><DialogTitle>{editing ? 'Edit Activity' : 'Log Activity'}</DialogTitle></DialogHeader>
          <ActivityForm
            defaultValues={editing ? {
              candidateId: editing.candidateId,
              applicationId: editing.applicationId,
              companyId: editing.companyId,
              contactId: editing.contactId,
              type: editing.type,
              activityDate: editing.activityDate?.replace('Z', '').replace('+00:00', '').substring(0, 16),
              outcome: editing.outcome,
              notes: editing.notes,
            } : undefined}
            onSubmit={handleSubmit}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type='submit' form='activity-form' disabled={isBusy}>{editing ? 'Save Changes' : 'Log'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
