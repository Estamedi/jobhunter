import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { candidatesApi, type Candidate, type CreateCandidateDto } from './api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Search, Archive, Trash2, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'

function CandidateForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: Partial<CreateCandidateDto>
  onSubmit: (data: CreateCandidateDto) => void
  isLoading: boolean
}) {
  const { register, handleSubmit } = useForm<CreateCandidateDto>({ defaultValues })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4' id='candidate-form'>
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1'>
          <Label>Full Name *</Label>
          <Input {...register('fullName')} required />
        </div>
        <div className='space-y-1'>
          <Label>Email *</Label>
          <Input type='email' {...register('email')} required />
        </div>
        <div className='space-y-1'>
          <Label>Phone</Label>
          <Input {...register('phone')} />
        </div>
        <div className='space-y-1'>
          <Label>Current Location</Label>
          <Input {...register('currentLocation')} />
        </div>
        <div className='space-y-1'>
          <Label>Target Countries</Label>
          <Input {...register('targetCountries')} placeholder='UK, UAE, Remote' />
        </div>
        <div className='space-y-1'>
          <Label>Target Roles</Label>
          <Input {...register('targetRoles')} placeholder='Backend Engineer, SRE' />
        </div>
      </div>
      <div className='space-y-1'>
        <Label>Notes</Label>
        <Textarea {...register('notes')} rows={3} />
      </div>
    </form>
  )
}

export function Candidates() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Candidate | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['candidates', search, isActiveFilter],
    queryFn: () => candidatesApi.list({ search: search || undefined, isActive: isActiveFilter }),
  })

  const create = useMutation({
    mutationFn: candidatesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); toast.success('Candidate created'); setDialogOpen(false) },
  })

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<CreateCandidateDto> }) => candidatesApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); toast.success('Candidate updated'); setDialogOpen(false) },
  })

  const archive = useMutation({
    mutationFn: candidatesApi.archive,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); toast.success('Candidate archived') },
  })

  const remove = useMutation({
    mutationFn: candidatesApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); toast.success('Candidate deleted') },
  })

  function openCreate() { setEditing(null); setDialogOpen(true) }
  function openEdit(c: Candidate) { setEditing(c); setDialogOpen(true) }

  function handleSubmit(dto: CreateCandidateDto) {
    if (editing) {
      update.mutate({ id: editing.id, dto })
    } else {
      create.mutate(dto)
    }
  }

  const isBusy = create.isPending || update.isPending

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search candidates...'
            className='pl-8'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant={isActiveFilter === true ? 'secondary' : 'outline'}
          size='sm'
          onClick={() => setIsActiveFilter(isActiveFilter === true ? undefined : true)}
        >
          Active
        </Button>
        <Button
          variant={isActiveFilter === false ? 'secondary' : 'outline'}
          size='sm'
          onClick={() => setIsActiveFilter(isActiveFilter === false ? undefined : false)}
        >
          Archived
        </Button>
        <Button onClick={openCreate} className='ml-auto'>
          <Plus className='h-4 w-4 mr-1' /> Add Candidate
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Target Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='w-10' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6}><Skeleton className='h-8 w-full' /></TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className='text-center text-muted-foreground py-8'>No candidates found.</TableCell>
              </TableRow>
            )}
            {data?.items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className='font-medium'>{c.fullName}</TableCell>
                <TableCell className='text-muted-foreground text-sm'>{c.email}</TableCell>
                <TableCell className='text-sm'>{c.currentLocation || '—'}</TableCell>
                <TableCell className='text-sm max-w-[200px] truncate'>{c.targetRoles || '—'}</TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? 'default' : 'secondary'}>
                    {c.isActive ? 'Active' : 'Archived'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='h-8 w-8'>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => openEdit(c)}>
                        <Pencil className='h-4 w-4 mr-2' /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => archive.mutate(c.id)}>
                        <Archive className='h-4 w-4 mr-2' /> {c.isActive ? 'Archive' : 'Restore'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className='text-destructive'
                        onClick={() => remove.mutate(c.id)}
                      >
                        <Trash2 className='h-4 w-4 mr-2' /> Delete
                      </DropdownMenuItem>
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
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Candidate' : 'Add Candidate'}</DialogTitle>
          </DialogHeader>
          <CandidateForm
            defaultValues={editing ?? undefined}
            onSubmit={handleSubmit}
            isLoading={isBusy}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type='submit' form='candidate-form' disabled={isBusy}>
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
