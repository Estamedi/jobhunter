import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Contact2, ExternalLink, Loader2, Mail, Phone, StickyNote } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { IconWhatsapp } from '@/assets/brand-icons'
import { contactsApi } from '../api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

const WARMTH_COLORS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  Hot: 'destructive',
  Warm: 'default',
  Cold: 'secondary',
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border bg-card p-5', className)}>{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex items-start justify-between gap-3 text-sm'>
      <span className='shrink-0 text-muted-foreground'>{label}</span>
      <span className='text-right font-medium'>{children}</span>
    </div>
  )
}

function toWhatsAppUrl(phone: string) {
  return `https://wa.me/${phone.replace(/[^\d+]/g, '').replace(/^\+/, '')}`
}

function DetailSkeleton() {
  return (
    <div className='space-y-5'>
      <Skeleton className='h-8 w-40' />
      <Skeleton className='h-40 w-full rounded-2xl' />
      <Skeleton className='h-48 w-full rounded-2xl' />
    </div>
  )
}

interface ContactDetailProps {
  contactId: number
}

export function ContactDetail({ contactId }: ContactDetailProps) {
  const qc = useQueryClient()
  const detailKey = ['contacts', 'detail', contactId]

  const { data: contact, isLoading } = useQuery({
    queryKey: detailKey,
    queryFn: () => contactsApi.get(contactId),
  })

  const [notes, setNotes] = useState('')
  const [notesTouched, setNotesTouched] = useState(false)

  const saveNotes = useMutation({
    mutationFn: async () => {
      if (!contact) return
      await contactsApi.update(contact.id, {
        fullName: contact.fullName,
        companyId: contact.companyId,
        jobTitle: contact.jobTitle,
        email: contact.email,
        phone: contact.phone,
        linkedInUrl: contact.linkedInUrl,
        type: contact.type,
        warmth: contact.warmth,
        notes: notes.trim() || undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: detailKey })
      qc.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Note saved')
    },
    onError: () => toast.error('Failed to save note'),
  })

  if (isLoading) return <DetailSkeleton />

  if (!contact) {
    return (
      <div className='space-y-4'>
        <Panel className='text-center text-sm text-muted-foreground'>
          We couldn’t find that contact. It may have been deleted.
        </Panel>
      </div>
    )
  }

  const currentNotes = notesTouched ? notes : (contact.notes ?? '')

  return (
    <div className='space-y-5'>
      <Panel className='space-y-4'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex min-w-0 items-start gap-4'>
            <div className='flex size-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400'>
              <Contact2 className='size-6' />
            </div>
            <div className='min-w-0'>
              <h1 className='truncate text-2xl font-bold tracking-tight'>{contact.fullName}</h1>
              <p className='truncate text-muted-foreground'>
                {contact.jobTitle}
                {contact.jobTitle && contact.companyName && ' at '}
                {contact.companyName}
              </p>
            </div>
          </div>
          <div className='flex shrink-0 items-center gap-2'>
            <Badge variant='outline' className='text-xs'>
              {contact.type}
            </Badge>
            <Badge variant={WARMTH_COLORS[contact.warmth] ?? 'secondary'} className='text-xs'>
              {contact.warmth}
            </Badge>
          </div>
        </div>

        <div className='space-y-1.5'>
          {contact.email && <Field label='Email'>{contact.email}</Field>}
          {contact.phone && <Field label='Phone'>{contact.phone}</Field>}
        </div>

        <div className='flex flex-wrap gap-2 pt-1'>
          {contact.email && (
            <Button variant='outline' size='sm' asChild>
              <a href={`mailto:${contact.email}`}>
                <Mail className='mr-1.5 size-3.5' /> Email
              </a>
            </Button>
          )}
          {contact.phone && (
            <>
              <Button variant='outline' size='sm' asChild>
                <a href={`tel:${contact.phone}`}>
                  <Phone className='mr-1.5 size-3.5' /> Call
                </a>
              </Button>
              <Button variant='outline' size='sm' asChild>
                <a href={toWhatsAppUrl(contact.phone)} target='_blank' rel='noopener noreferrer'>
                  <IconWhatsapp className='mr-1.5 size-3.5' /> WhatsApp
                </a>
              </Button>
            </>
          )}
          {contact.linkedInUrl && (
            <Button variant='outline' size='sm' asChild>
              <a href={contact.linkedInUrl} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='mr-1.5 size-3.5' /> LinkedIn
              </a>
            </Button>
          )}
        </div>
      </Panel>

      <Panel className='space-y-3'>
        <div className='flex items-center gap-3'>
          <div className='flex size-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400'>
            <StickyNote className='size-4' />
          </div>
          <h4 className='text-sm font-semibold'>Notes</h4>
        </div>
        <Textarea
          value={currentNotes}
          onChange={(e) => {
            setNotes(e.target.value)
            setNotesTouched(true)
          }}
          rows={5}
          placeholder='Add a note about this contact...'
          className='resize-none rounded-xl'
          disabled={saveNotes.isPending}
        />
        <div className='flex justify-end'>
          <Button
            size='sm'
            onClick={() => saveNotes.mutate()}
            disabled={saveNotes.isPending || currentNotes.trim() === (contact.notes ?? '').trim()}
          >
            {saveNotes.isPending && <Loader2 className='mr-1.5 size-3.5 animate-spin' />}
            Save note
          </Button>
        </div>
      </Panel>
    </div>
  )
}
