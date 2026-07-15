import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  StickyNote,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { notesApi, type Note, type SaveNoteDto } from './api'
import { applicationsApi } from '@/features/applications/api'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { ConfirmDialog } from '@/components/confirm-dialog'
import { toast } from 'sonner'

const PAGE_SIZE = 10

function NoteForm({
  applications,
  defaultValues,
  onSubmit,
}: {
  applications: { id: number; label: string }[]
  defaultValues?: { content: string; applicationId?: number }
  onSubmit: (data: SaveNoteDto) => void
}) {
  const [content, setContent] = useState(defaultValues?.content ?? '')
  const [applicationId, setApplicationId] = useState(
    defaultValues?.applicationId ? String(defaultValues.applicationId) : ''
  )

  return (
    <form
      id='note-form'
      className='space-y-4'
      onSubmit={(e) => {
        e.preventDefault()
        if (!content.trim()) return
        onSubmit({
          content: content.trim(),
          applicationId: applicationId ? Number(applicationId) : undefined,
        })
      }}
    >
      <div className='space-y-1'>
        <Label>Note *</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          placeholder='Jot something down...'
          required
        />
      </div>
      <div className='space-y-1'>
        <Label>Link to Application</Label>
        <select
          value={applicationId}
          onChange={(e) => setApplicationId(e.target.value)}
          className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm'
        >
          <option value=''>None</option>
          {applications.map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>
      </div>
    </form>
  )
}

export function Notes() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Note | null>(null)
  const [deleting, setDeleting] = useState<Note | null>(null)

  const { data: applicationsResult } = useQuery({
    queryKey: ['applications', 'all'],
    queryFn: () => applicationsApi.list({ pageSize: 100 }),
  })

  const { data: notesResult, isLoading } = useQuery({
    queryKey: ['notes', page],
    queryFn: () => notesApi.list({ page, pageSize: PAGE_SIZE }),
    placeholderData: (previousData) => previousData,
  })
  const notes = notesResult?.items
  const total = notesResult?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const applicationLabels = new Map(
    (applicationsResult?.items ?? []).map((a) => [
      a.id,
      `${a.companyName ?? 'Company'} — ${a.jobRoleTitle ?? 'Role'}`,
    ])
  )

  const create = useMutation({
    mutationFn: (dto: SaveNoteDto) => notesApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Note created')
      setDialogOpen(false)
      setPage(1)
    },
    onError: () => toast.error('Failed to create note'),
  })

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: SaveNoteDto }) => notesApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Note updated')
      setDialogOpen(false)
      setEditing(null)
    },
    onError: () => toast.error('Failed to update note'),
  })

  const remove = useMutation({
    mutationFn: notesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Note deleted')
      setDeleting(null)
      if (notes?.length === 1 && page > 1) setPage(page - 1)
    },
    onError: () => toast.error('Failed to delete note'),
  })

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(note: Note) {
    setEditing(note)
    setDialogOpen(true)
  }

  function handleSubmit(dto: SaveNoteDto) {
    if (editing) {
      update.mutate({ id: editing.id, dto })
    } else {
      create.mutate(dto)
    }
  }

  const isBusy = create.isPending || update.isPending

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-end'>
        <Button onClick={openCreate}>
          <Plus className='h-4 w-4 mr-1' /> Add Note
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Note</TableHead>
              <TableHead>Linked Application</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className='w-10' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4}><Skeleton className='h-8 w-full' /></TableCell>
              </TableRow>
            )}
            {!isLoading && notes?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className='text-center text-muted-foreground py-8'>No notes yet.</TableCell>
              </TableRow>
            )}
            {notes?.map((note) => (
              <TableRow key={note.id}>
                <TableCell className='font-medium max-w-[420px]'>
                  <div className='flex items-start gap-2'>
                    <StickyNote className='h-4 w-4 mt-0.5 shrink-0 text-muted-foreground' />
                    <span className='line-clamp-2'>{note.content}</span>
                  </div>
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>
                  {note.applicationId ? applicationLabels.get(note.applicationId) ?? `#${note.applicationId}` : '—'}
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>{format(new Date(note.lastModified), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='h-8 w-8'>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => openEdit(note)}>
                        <Pencil className='h-4 w-4 mr-2' /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className='text-destructive' onClick={() => setDeleting(note)}>
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

      {total > 0 && (
        <div className='flex items-center justify-between'>
          <p className='text-sm text-muted-foreground'>
            Page {page} of {totalPages} ({total} {total === 1 ? 'note' : 'notes'})
          </p>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className='h-4 w-4 mr-1' /> Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next <ChevronRight className='h-4 w-4 ml-1' />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null) }}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Note' : 'Add Note'}</DialogTitle>
          </DialogHeader>
          <NoteForm
            applications={[...applicationLabels.entries()].map(([id, label]) => ({ id, label }))}
            defaultValues={editing ? { content: editing.content, applicationId: editing.applicationId } : undefined}
            onSubmit={handleSubmit}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type='submit' form='note-form' disabled={isBusy}>
              {editing ? 'Save' : 'Add Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title='Delete Note'
        desc='Are you sure you want to delete this note? This cannot be undone.'
        destructive
        confirmText='Delete'
        isLoading={remove.isPending}
        handleConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  )
}
