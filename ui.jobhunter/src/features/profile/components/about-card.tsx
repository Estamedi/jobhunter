import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ExpandableText } from './expandable-text'
import { ProfileCard } from './profile-card'

const SUMMARY_MAX = 2600

function AboutForm({
  summary,
  isSaving,
  onSave,
  onClose,
}: {
  summary: string
  isSaving: boolean
  onSave: (summary: string) => void
  onClose: () => void
}) {
  const [text, setText] = useState(summary)

  return (
    <>
      <form
        id='about-form'
        className='space-y-2'
        onSubmit={(e) => {
          e.preventDefault()
          onSave(text)
        }}
      >
        <Label htmlFor='about-summary'>About</Label>
        <Textarea
          id='about-summary'
          rows={10}
          maxLength={SUMMARY_MAX}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='A short summary of your experience and what you are good at.'
        />
        <p className='text-end text-xs text-muted-foreground'>
          {text.length}/{SUMMARY_MAX.toLocaleString()}
        </p>
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

// The About section: the summary, cut to three lines with "see more". It edits the summary only; the page
// sends the current name and headline with the save so they are not lost.
export function AboutCard({
  summary,
  isSaving,
  onSave,
  openEditSignal = 0,
}: {
  summary?: string | null
  isSaving: boolean
  onSave: (summary: string, done: () => void) => void
  // Goes up when the page asks for the edit dialog to open (the checklist's "add an About").
  openEditSignal?: number
}) {
  const [open, setOpen] = useState(false)
  // Opens the dialog when the signal goes up, adjusted while rendering as React recommends.
  const [seenSignal, setSeenSignal] = useState(openEditSignal)
  if (seenSignal !== openEditSignal) {
    setSeenSignal(openEditSignal)
    setOpen(true)
  }

  return (
    <ProfileCard id='section-about' title='About' onEdit={() => setOpen(true)}>
      {summary ? (
        <ExpandableText text={summary} />
      ) : (
        <p className='text-sm text-muted-foreground'>
          Write a short summary of your experience. It helps your CV and your
          profile.
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-xl'>
          <DialogHeader>
            <DialogTitle>Edit about</DialogTitle>
          </DialogHeader>
          {open && (
            <AboutForm
              summary={summary ?? ''}
              isSaving={isSaving}
              onSave={(s) => onSave(s, () => setOpen(false))}
              onClose={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </ProfileCard>
  )
}
