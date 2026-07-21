import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsApi, type JobContact, type CreateContactDto } from './api'
import { ContactDetailDialog } from './components/contact-detail-dialog'
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
import { Plus, MoreHorizontal, Search, Trash2, Pencil, Eye } from 'lucide-react'
import { useForm } from 'react-hook-form'

const WARMTH_COLORS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  Hot: 'destructive',
  Warm: 'default',
  Cold: 'secondary',
}

function ContactForm({ defaultValues, onSubmit }: { defaultValues?: Partial<CreateContactDto>; onSubmit: (d: CreateContactDto) => void }) {
  const { register, handleSubmit } = useForm<CreateContactDto>({ defaultValues })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4' id='contact-form'>
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1 col-span-2'>
          <Label>Full Name *</Label>
          <Input {...register('fullName')} required />
        </div>
        <div className='space-y-1'>
          <Label>Email</Label>
          <Input type='email' {...register('email')} />
        </div>
        <div className='space-y-1'>
          <Label>Phone</Label>
          <Input {...register('phone')} />
        </div>
        <div className='space-y-1'>
          <Label>Job Title</Label>
          <Input {...register('jobTitle')} />
        </div>
        <div className='space-y-1'>
          <Label>LinkedIn URL</Label>
          <Input {...register('linkedInUrl')} />
        </div>
        <div className='space-y-1'>
          <Label>Type</Label>
          <select {...register('type')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm'>
            {['Recruiter', 'HiringManager', 'Referral', 'NetworkConnection', 'Other'].map((t) => (
              <option key={t} value={t}>{t.replace(/([A-Z])/g, ' $1').trim()}</option>
            ))}
          </select>
        </div>
        <div className='space-y-1'>
          <Label>Warmth</Label>
          <select {...register('warmth')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm'>
            {['Cold', 'Warm', 'Hot'].map((w) => <option key={w} value={w}>{w}</option>)}
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

export function Contacts() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<JobContact | null>(null)
  const [viewingContactId, setViewingContactId] = useState<number | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  function openContact(id: number) {
    setViewingContactId(id)
    setViewDialogOpen(true)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', search],
    queryFn: () => contactsApi.list({ search: search || undefined }),
  })

  const create = useMutation({
    mutationFn: contactsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contact created'); setDialogOpen(false) },
  })

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<CreateContactDto> }) => contactsApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contact updated'); setDialogOpen(false) },
  })

  const remove = useMutation({
    mutationFn: contactsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contact deleted') },
  })

  function handleSubmit(dto: CreateContactDto) {
    if (editing) update.mutate({ id: editing.id, dto })
    else create.mutate(dto)
  }

  const isBusy = create.isPending || update.isPending

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Search contacts...' className='pl-8' value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }} className='ml-auto'>
          <Plus className='h-4 w-4 mr-1' /> Add Contact
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Warmth</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className='w-10' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7}><Skeleton className='h-8 w-full' /></TableCell></TableRow>}
            {!isLoading && data?.items.length === 0 && (
              <TableRow><TableCell colSpan={7} className='text-center text-muted-foreground py-8'>No contacts found.</TableCell></TableRow>
            )}
            {data?.items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className='font-medium'>{c.fullName}</TableCell>
                <TableCell className='text-sm'>{c.companyName || '—'}</TableCell>
                <TableCell className='text-sm'>{c.jobTitle || '—'}</TableCell>
                <TableCell><Badge variant='outline' className='text-xs'>{c.type}</Badge></TableCell>
                <TableCell><Badge variant={WARMTH_COLORS[c.warmth] ?? 'secondary'}>{c.warmth}</Badge></TableCell>
                <TableCell className='text-sm text-muted-foreground'>{c.email || '—'}</TableCell>
                <TableCell>
                  <div className='flex items-center justify-end gap-1'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8'
                      aria-label='View contact'
                      onClick={() => openContact(c.id)}
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='h-8 w-8'><MoreHorizontal className='h-4 w-4' /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => { setEditing(c); setDialogOpen(true) }}><Pencil className='h-4 w-4 mr-2' /> Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className='text-destructive' onClick={() => remove.mutate(c.id)}><Trash2 className='h-4 w-4 mr-2' /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader><DialogTitle>{editing ? 'Edit Contact' : 'Add Contact'}</DialogTitle></DialogHeader>
          <ContactForm defaultValues={editing ?? undefined} onSubmit={handleSubmit} />
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type='submit' form='contact-form' disabled={isBusy}>{editing ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ContactDetailDialog contactId={viewingContactId} open={viewDialogOpen} onOpenChange={setViewDialogOpen} />
    </div>
  )
}
