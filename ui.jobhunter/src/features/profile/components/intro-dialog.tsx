import { useState } from 'react'
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

const HEADLINE_MAX = 220

function IntroForm({
  fullName,
  headline,
  isSaving,
  onSave,
  onClose,
}: {
  fullName: string
  headline: string
  isSaving: boolean
  onSave: (fullName: string, headline: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(fullName)
  const [head, setHead] = useState(headline)

  return (
    <>
      <form
        id='intro-form'
        className='space-y-4'
        onSubmit={(e) => {
          e.preventDefault()
          onSave(name.trim(), head)
        }}
      >
        <div className='space-y-1'>
          <Label htmlFor='intro-name'>Full name*</Label>
          <Input
            id='intro-name'
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className='space-y-1'>
          <Label htmlFor='intro-headline'>Headline</Label>
          <Input
            id='intro-headline'
            maxLength={HEADLINE_MAX}
            value={head}
            onChange={(e) => setHead(e.target.value)}
            placeholder='Ex: Software engineer | 13+ years exp'
          />
          <p className='text-end text-xs text-muted-foreground'>
            {head.length}/{HEADLINE_MAX}
          </p>
        </div>
      </form>
      <DialogFooter>
        <Button variant='outline' onClick={onClose}>
          Cancel
        </Button>
        <Button
          type='submit'
          form='intro-form'
          disabled={isSaving || !name.trim()}
        >
          Save
        </Button>
      </DialogFooter>
    </>
  )
}

// Edits the name and the headline. The About text has its own dialog, and the page sends the current
// About text with this save so it is not lost.
export function IntroDialog({
  open,
  onOpenChange,
  fullName,
  headline,
  isSaving,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  fullName: string
  headline: string
  isSaving: boolean
  onSave: (fullName: string, headline: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Edit intro</DialogTitle>
        </DialogHeader>
        {open && (
          <IntroForm
            fullName={fullName}
            headline={headline}
            isSaving={isSaving}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
