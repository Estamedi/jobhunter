import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ContactDetail } from './contact-detail'

interface ContactDetailDialogProps {
  contactId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactDetailDialog({ contactId, open, onOpenChange }: ContactDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl sm:max-w-2xl'>
        <DialogTitle className='sr-only'>Contact details</DialogTitle>
        {contactId != null && <ContactDetail contactId={contactId} />}
      </DialogContent>
    </Dialog>
  )
}
