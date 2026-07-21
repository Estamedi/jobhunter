import { useState, type KeyboardEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { notesApi, type Note } from '@/features/notes/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/confirm-dialog'

export function ApplicationNotes({ applicationId }: { applicationId: number }) {
  const qc = useQueryClient()
  const notesKey = ['notes', 'byApplication', applicationId]

  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [deleting, setDeleting] = useState<Note | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: notesKey,
    queryFn: () => notesApi.list({ applicationId, pageSize: 100 }),
  })
  const notes = data?.items ?? []

  const create = useMutation({
    mutationFn: (content: string) => notesApi.create({ content, applicationId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notesKey })
      setDraft('')
    },
    onError: () => toast.error('Failed to add note'),
  })

  const update = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      notesApi.update(id, { content, applicationId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notesKey })
      toast.success('Note updated')
      setEditingId(null)
    },
    onError: () => toast.error('Failed to update note'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => notesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notesKey })
      toast.success('Note deleted')
      setDeleting(null)
    },
    onError: () => toast.error('Failed to delete note'),
  })

  function submitDraft() {
    const trimmed = draft.trim()
    if (!trimmed) return
    create.mutate(trimmed)
  }

  function handleDraftKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      submitDraft()
    }
  }

  function startEditing(note: Note) {
    setEditingId(note.id)
    setEditingText(note.content)
  }

  function saveEditing(note: Note) {
    const trimmed = editingText.trim()
    if (!trimmed) return
    if (trimmed === note.content.trim()) {
      setEditingId(null)
      return
    }
    update.mutate({ id: note.id, content: trimmed })
  }

  function handleEditKeyDown(e: KeyboardEvent<HTMLTextAreaElement>, note: Note) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      saveEditing(note)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditingId(null)
    }
  }

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleDraftKeyDown}
          rows={2}
          placeholder='Interview prep, referral details, anything worth remembering...'
          className='resize-none rounded-xl'
          disabled={create.isPending}
        />
        <div className='flex justify-end'>
          <Button size='sm' onClick={submitDraft} disabled={create.isPending || !draft.trim()}>
            {create.isPending && <Loader2 className='mr-1.5 size-3.5 animate-spin' />}
            Add note
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className='text-sm text-muted-foreground'>Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className='text-sm text-muted-foreground italic'>No notes yet — the first one you add will show up here.</p>
      ) : (
        <ul className='space-y-3'>
          {notes.map((note) => (
            <li key={note.id} className='group rounded-xl border bg-muted/30 p-3'>
              {editingId === note.id ? (
                <div className='space-y-2'>
                  <Textarea
                    autoFocus
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, note)}
                    rows={3}
                    className='resize-none rounded-xl bg-background'
                    disabled={update.isPending}
                  />
                  <div className='flex items-center justify-end gap-2'>
                    <Button variant='outline' size='sm' onClick={() => setEditingId(null)} disabled={update.isPending}>
                      Cancel
                    </Button>
                    <Button size='sm' onClick={() => saveEditing(note)} disabled={update.isPending}>
                      {update.isPending && <Loader2 className='mr-1.5 size-3.5 animate-spin' />}
                      Save note
                    </Button>
                  </div>
                </div>
              ) : (
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='text-sm whitespace-pre-line'>{note.content}</p>
                    <p className='mt-1.5 text-xs text-muted-foreground' title={format(new Date(note.lastModified), 'PPpp')}>
                      {formatDistanceToNowStrict(new Date(note.lastModified), { addSuffix: true })}
                    </p>
                  </div>
                  <div className='flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-7 text-muted-foreground hover:text-foreground'
                      aria-label='Edit note'
                      onClick={() => startEditing(note)}
                    >
                      <Pencil className='size-3.5' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-7 text-muted-foreground hover:text-destructive'
                      aria-label='Delete note'
                      onClick={() => setDeleting(note)}
                    >
                      <Trash2 className='size-3.5' />
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title='Delete note'
        desc='Are you sure you want to delete this note? This cannot be undone.'
        destructive
        confirmText='Delete'
        isLoading={remove.isPending}
        handleConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  )
}
