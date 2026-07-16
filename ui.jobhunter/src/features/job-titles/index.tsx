import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobTitlesApi, type JobTitle, type CreateJobTitleDto } from './api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ListPagination } from '@/components/list-pagination'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Search, Trash2, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'

const PAGE_SIZE = 20

function JobTitleForm({ defaultValues, onSubmit }: { defaultValues?: Partial<CreateJobTitleDto>; onSubmit: (d: CreateJobTitleDto) => void }) {
  const { register, handleSubmit } = useForm<CreateJobTitleDto>({ defaultValues })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4' id='jobtitle-form'>
      <div className='space-y-1'>
        <Label>Name *</Label>
        <Input {...register('name')} placeholder='e.g. Software Engineer' required />
      </div>
      <div className='space-y-1'>
        <Label>Description</Label>
        <Textarea {...register('description')} rows={3} placeholder='What this role typically involves...' />
      </div>
    </form>
  )
}

export function JobTitles() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<JobTitle | null>(null)

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['job-titles', search, page],
    queryFn: () => jobTitlesApi.list({ search: search || undefined, page, pageSize: PAGE_SIZE }),
  })

  const create = useMutation({
    mutationFn: jobTitlesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-titles'] }); toast.success('Job title created'); setDialogOpen(false) },
  })

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<CreateJobTitleDto> }) => jobTitlesApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-titles'] }); toast.success('Job title updated'); setDialogOpen(false) },
  })

  const remove = useMutation({
    mutationFn: jobTitlesApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-titles'] }); toast.success('Job title deleted') },
  })

  function handleSubmit(dto: CreateJobTitleDto) {
    if (editing) update.mutate({ id: editing.id, dto })
    else create.mutate(dto)
  }

  const isBusy = create.isPending || update.isPending

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Search job titles...' className='pl-8' value={search} onChange={(e) => handleSearchChange(e.target.value)} />
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }} className='ml-auto'>
          <Plus className='h-4 w-4 mr-1' /> Add Job Title
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Vacancies</TableHead>
              <TableHead className='w-16' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={4}><Skeleton className='h-8 w-full' /></TableCell></TableRow>}
            {!isLoading && data?.items.length === 0 && (
              <TableRow><TableCell colSpan={4} className='text-center text-muted-foreground py-8'>No job titles found.</TableCell></TableRow>
            )}
            {data?.items.map((t) => (
              <TableRow key={t.id}>
                <TableCell className='font-medium'>{t.name}</TableCell>
                <TableCell className='text-sm text-muted-foreground max-w-[300px] truncate' title={t.description || undefined}>
                  {t.description || '—'}
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>{t.jobRoleCount}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='h-8 w-8'><MoreHorizontal className='h-4 w-4' /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => { setEditing(t); setDialogOpen(true) }}><Pencil className='h-4 w-4 mr-2' /> Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className='text-destructive' onClick={() => remove.mutate(t.id)}><Trash2 className='h-4 w-4 mr-2' /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && (
        <ListPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} itemLabel='job title' />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader><DialogTitle>{editing ? 'Edit Job Title' : 'Add Job Title'}</DialogTitle></DialogHeader>
          <JobTitleForm defaultValues={editing ?? undefined} onSubmit={handleSubmit} />
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type='submit' form='jobtitle-form' disabled={isBusy}>{editing ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
