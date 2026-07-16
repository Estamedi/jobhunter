import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobRolesApi, type JobRole, type CreateJobRoleDto } from './api'
import { jobTitlesApi } from '@/features/job-titles/api'
import { EntityCombobox, type EntityOption } from '@/components/entity-combobox'
import { ListPagination } from '@/components/list-pagination'
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
import { Plus, MoreHorizontal, Search, Trash2, Pencil, ExternalLink } from 'lucide-react'
import { useForm } from 'react-hook-form'

const PAGE_SIZE = 20

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  Open: 'default',
  Closed: 'secondary',
  Paused: 'destructive',
}

function JobRoleForm({ defaultValues, onSubmit }: { defaultValues?: Partial<JobRole>; onSubmit: (d: CreateJobRoleDto) => void }) {
  const { register, handleSubmit } = useForm<CreateJobRoleDto>({ defaultValues })
  const [jobTitle, setJobTitle] = useState<EntityOption | null>(
    defaultValues?.jobTitleId ? { value: defaultValues.jobTitleId, label: defaultValues.jobTitleName ?? `#${defaultValues.jobTitleId}` } : null
  )

  function submit(dto: CreateJobRoleDto) {
    onSubmit({ ...dto, jobTitleId: jobTitle?.value })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className='space-y-4' id='jobrole-form'>
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1'>
          <Label>Title *</Label>
          <Input {...register('title')} required />
        </div>
        <div className='space-y-1'>
          <Label>Company ID *</Label>
          <Input type='number' {...register('companyId', { valueAsNumber: true })} required />
        </div>
        <div className='space-y-1 col-span-2'>
          <Label>Job Title (catalog)</Label>
          <EntityCombobox
            value={jobTitle}
            onChange={setJobTitle}
            queryKey={['job-titles', 'combobox']}
            placeholder='Select job title...'
            searchPlaceholder='Search job titles...'
            createLabel={(name) => `Create job title "${name}"`}
            fetchOptions={(search) =>
              jobTitlesApi.list({ search: search || undefined, pageSize: 20 }).then((r) => r.items.map((t) => ({ value: t.id, label: t.name })))
            }
            onCreate={(name) => jobTitlesApi.create({ name }).then((id) => ({ value: id, label: name }))}
          />
        </div>
        <div className='space-y-1 col-span-2'>
          <Label>Job Link</Label>
          <Input {...register('jobLink')} placeholder='https://' />
        </div>
        <div className='space-y-1'>
          <Label>Source</Label>
          <select {...register('source')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm'>
            {['LinkedIn', 'Referral', 'CompanyWebsite', 'Recruiter', 'JobBoard', 'Other'].map((s) => (
              <option key={s} value={s}>{s.replace(/([A-Z])/g, ' $1').trim()}</option>
            ))}
          </select>
        </div>
        <div className='space-y-1'>
          <Label>Work Type</Label>
          <select {...register('workType')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm'>
            {['Remote', 'OnSite', 'Hybrid'].map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div className='space-y-1'>
          <Label>Country</Label>
          <Input {...register('country')} />
        </div>
        <div className='space-y-1'>
          <Label>City</Label>
          <Input {...register('city')} />
        </div>
        <div className='space-y-1'>
          <Label>Salary Min</Label>
          <Input type='number' {...register('salaryMin', { valueAsNumber: true })} />
        </div>
        <div className='space-y-1'>
          <Label>Salary Max</Label>
          <Input type='number' {...register('salaryMax', { valueAsNumber: true })} />
        </div>
        <div className='space-y-1'>
          <Label>Currency</Label>
          <Input {...register('currency')} placeholder='USD, GBP, EUR' />
        </div>
        <div className='space-y-1'>
          <Label>Status</Label>
          <select {...register('roleStatus')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm'>
            {['Open', 'Closed', 'Paused'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className='space-y-1'>
        <Label>Description</Label>
        <Textarea {...register('description')} rows={3} />
      </div>
    </form>
  )
}

export function JobRoles() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<JobRole | null>(null)

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['job-roles', search, page],
    queryFn: () => jobRolesApi.list({ search: search || undefined, page, pageSize: PAGE_SIZE }),
  })

  const create = useMutation({
    mutationFn: jobRolesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-roles'] }); toast.success('Job role created'); setDialogOpen(false) },
  })

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<CreateJobRoleDto> }) => jobRolesApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-roles'] }); toast.success('Job role updated'); setDialogOpen(false) },
  })

  const remove = useMutation({
    mutationFn: jobRolesApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-roles'] }); toast.success('Job role deleted') },
  })

  function handleSubmit(dto: CreateJobRoleDto) {
    if (editing) update.mutate({ id: editing.id, dto })
    else create.mutate(dto)
  }

  const isBusy = create.isPending || update.isPending

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Search job roles...' className='pl-8' value={search} onChange={(e) => handleSearchChange(e.target.value)} />
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }} className='ml-auto'>
          <Plus className='h-4 w-4 mr-1' /> Add Job Role
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Work Type</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='w-16' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={8}><Skeleton className='h-8 w-full' /></TableCell></TableRow>}
            {!isLoading && data?.items.length === 0 && (
              <TableRow><TableCell colSpan={8} className='text-center text-muted-foreground py-8'>No job roles found.</TableCell></TableRow>
            )}
            {data?.items.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className='flex items-center gap-1.5'>
                    <span className='font-medium'>{r.title}</span>
                    {r.jobLink && <a href={r.jobLink} target='_blank' rel='noopener noreferrer'><ExternalLink className='h-3.5 w-3.5 text-muted-foreground' /></a>}
                  </div>
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>{r.jobTitleName ?? '—'}</TableCell>
                <TableCell className='text-sm'>{r.companyName || `#${r.companyId}`}</TableCell>
                <TableCell className='text-sm'>{[r.city, r.country].filter(Boolean).join(', ') || '—'}</TableCell>
                <TableCell><Badge variant='outline' className='text-xs'>{r.workType}</Badge></TableCell>
                <TableCell className='text-sm'>
                  {r.salaryMin || r.salaryMax
                    ? `${r.salaryMin?.toLocaleString() ?? '?'} – ${r.salaryMax?.toLocaleString() ?? '?'} ${r.currency ?? ''}`
                    : '—'}
                </TableCell>
                <TableCell><Badge variant={STATUS_COLORS[r.roleStatus] ?? 'secondary'}>{r.roleStatus}</Badge></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='h-8 w-8'><MoreHorizontal className='h-4 w-4' /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => { setEditing(r); setDialogOpen(true) }}><Pencil className='h-4 w-4 mr-2' /> Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className='text-destructive' onClick={() => remove.mutate(r.id)}><Trash2 className='h-4 w-4 mr-2' /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && (
        <ListPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} itemLabel='job role' />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader><DialogTitle>{editing ? 'Edit Job Role' : 'Add Job Role'}</DialogTitle></DialogHeader>
          <JobRoleForm defaultValues={editing ?? undefined} onSubmit={handleSubmit} />
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type='submit' form='jobrole-form' disabled={isBusy}>{editing ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
