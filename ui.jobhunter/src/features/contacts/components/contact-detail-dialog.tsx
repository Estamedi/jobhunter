import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ContactDetail } from './contact-detail'

interface ContactDetailDialogProps {
  contactId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactDetailDialog({ contactId, open, onOpenChange }: ContactDetailDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl sm:max-w-2xl'>
        <DialogTitle className='sr-only'>{t('Contact details')}</DialogTitle>
        {contactId != null && <ContactDetail contactId={contactId} />}
      </DialogContent>
    </Dialog>
  )
}
