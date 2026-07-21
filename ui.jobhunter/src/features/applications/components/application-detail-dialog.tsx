import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ApplicationDetail } from './application-detail'

interface ApplicationDetailDialogProps {
  applicationId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApplicationDetailDialog({ applicationId, open, onOpenChange }: ApplicationDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-5xl overflow-y-auto rounded-2xl sm:max-w-5xl'>
        <DialogTitle className='sr-only'>Application details</DialogTitle>
        {applicationId != null && (
          <ApplicationDetail applicationId={applicationId} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
