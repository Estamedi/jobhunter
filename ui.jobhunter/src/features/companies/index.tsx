import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesApi, type JobCompany, type CreateCompanyDto } from './api'
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

const PRIORITIES = ['Low', 'Medium', 'High']

function CompanyForm({ defaultValues, onSubmit }: { defaultValues?: Partial<CreateCompanyDto>; onSubmit: (d: CreateCompanyDto) => void; isLoading: boolean }) {
  const { register, handleSubmit } = useForm<CreateCompanyDto>({ defaultValues })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4' id='company-form'>
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1 col-span-2'>
          <Label>Company Name *</Label>
          <Input {...register('name')} required />
        </div>
        <div className='space-y-1'>
          <Label>Website</Label>
          <Input {...register('website')} placeholder='https://' />
        </div>
        <div className='space-y-1'>
          <Label>LinkedIn URL</Label>
          <Input {...register('linkedInUrl')} placeholder='https://linkedin.com/company/' />
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
          <Label>Industry</Label>
          <Input {...register('industry')} />
        </div>
        <div className='space-y-1'>
          <Label>Company Size</Label>
          <Input {...register('companySize')} placeholder='1-50, 51-200, 201-1000...' />
        </div>
        <div className='space-y-1'>
          <Label>Priority</Label>
          <select {...register('priority')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm'>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className='space-y-1'>
        <Label>Notes</Label>
        <Textarea {...register('notes')} rows={3} />
      </div>
    </form>
  )
}

export function Companies() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<JobCompany | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['companies', search],
    queryFn: () => companiesApi.list({ search: search || undefined }),
  })

  const create = useMutation({
    mutationFn: companiesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); toast.success('Company created'); setDialogOpen(false) },
  })

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<CreateCompanyDto> }) => companiesApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); toast.success('Company updated'); setDialogOpen(false) },
  })

  const remove = useMutation({
    mutationFn: companiesApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); toast.success('Company deleted') },
  })

  function openCreate() { setEditing(null); setDialogOpen(true) }
  function openEdit(c: JobCompany) { setEditing(c); setDialogOpen(true) }

  function handleSubmit(dto: CreateCompanyDto) {
    if (editing) update.mutate({ id: editing.id, dto })
    else create.mutate(dto)
  }

  const isBusy = create.isPending || update.isPending

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Search companies...' className='pl-8' value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={openCreate} className='ml-auto'>
          <Plus className='h-4 w-4 mr-1' /> Add Company
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Links</TableHead>
              <TableHead className='w-10' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6}><Skeleton className='h-8 w-full' /></TableCell></TableRow>}
            {!isLoading && data?.items.length === 0 && (
              <TableRow><TableCell colSpan={6} className='text-center text-muted-foreground py-8'>No companies found.</TableCell></TableRow>
            )}
            {data?.items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className='font-medium'>{c.name}</TableCell>
                <TableCell className='text-sm'>{c.industry || '—'}</TableCell>
                <TableCell className='text-sm'>{[c.city, c.country].filter(Boolean).join(', ') || '—'}</TableCell>
                <TableCell>
                  <Badge variant={c.priority === 'High' ? 'destructive' : c.priority === 'Medium' ? 'default' : 'secondary'}>{c.priority}</Badge>
                </TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    {c.website && <a href={c.website} target='_blank' rel='noopener noreferrer'><ExternalLink className='h-4 w-4 text-muted-foreground hover:text-foreground' /></a>}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='h-8 w-8'><MoreHorizontal className='h-4 w-4' /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => openEdit(c)}><Pencil className='h-4 w-4 mr-2' /> Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className='text-destructive' onClick={() => remove.mutate(c.id)}><Trash2 className='h-4 w-4 mr-2' /> Delete</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>{editing ? 'Edit Company' : 'Add Company'}</DialogTitle></DialogHeader>
          <CompanyForm defaultValues={editing ?? undefined} onSubmit={handleSubmit} isLoading={isBusy} />
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type='submit' form='company-form' disabled={isBusy}>{editing ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
