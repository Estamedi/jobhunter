import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const HEADLINE_MAX = 220
const SUMMARY_MAX = 2600

function AboutForm({
  headline,
  summary,
  isSaving,
  onSave,
  onClose,
}: {
  headline: string
  summary: string
  isSaving: boolean
  onSave: (headline: string, summary: string) => void
  onClose: () => void
}) {
  const [h, setH] = useState(headline)
  const [s, setS] = useState(summary)

  return (
    <>
      <form
        id='about-form'
        className='space-y-4'
        onSubmit={(e) => {
          e.preventDefault()
          onSave(h, s)
        }}
      >
        <div className='space-y-1'>
          <Label htmlFor='about-headline'>Profile headline</Label>
          <Input
            id='about-headline'
            maxLength={HEADLINE_MAX}
            value={h}
            onChange={(e) => setH(e.target.value)}
            placeholder='Ex: Software engineer | 13+ years exp'
          />
          <p className='text-right text-xs text-muted-foreground'>
            {h.length}/{HEADLINE_MAX}
          </p>
        </div>
        <div className='space-y-1'>
          <Label htmlFor='about-summary'>About</Label>
          <Textarea
            id='about-summary'
            rows={8}
            maxLength={SUMMARY_MAX}
            value={s}
            onChange={(e) => setS(e.target.value)}
          />
          <p className='text-right text-xs text-muted-foreground'>
            {s.length}/{SUMMARY_MAX.toLocaleString()}
          </p>
        </div>
      </form>
      <DialogFooter>
        <Button variant='outline' onClick={onClose}>
          Cancel
        </Button>
        <Button type='submit' form='about-form' disabled={isSaving}>
          Save
        </Button>
      </DialogFooter>
    </>
  )
}

export function AboutCard({
  fullName,
  headline,
  summary,
  isSaving,
  onSave,
}: {
  fullName: string
  headline?: string | null
  summary?: string | null
  isSaving: boolean
  onSave: (headline: string, summary: string, done: () => void) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <section className='rounded-md border p-5'>
      <div className='flex items-start justify-between gap-2'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>{fullName}</h1>
          <p className='text-muted-foreground'>
            {headline || 'Add a headline'}
          </p>
        </div>
        <Button
          variant='ghost'
          size='icon'
          title='Edit about'
          onClick={() => setOpen(true)}
        >
          <Pencil className='h-4 w-4' />
        </Button>
      </div>
      {summary && <p className='mt-4 text-sm whitespace-pre-line'>{summary}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-xl'>
          <DialogHeader>
            <DialogTitle>Edit about</DialogTitle>
          </DialogHeader>
          {open && (
            <AboutForm
              headline={headline ?? ''}
              summary={summary ?? ''}
              isSaving={isSaving}
              onSave={(h, s) => onSave(h, s, () => setOpen(false))}
              onClose={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
