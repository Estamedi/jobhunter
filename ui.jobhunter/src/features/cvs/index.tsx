import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, MoreHorizontal, Download, Trash2, FileText, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { cvsApi, type Cv } from './api'
import { downloadCvFile, viewCvFile } from './lib/cv-file'
import { LinkedinPdfGuide } from '@/features/profile/components/linkedin-pdf-guide'
import { candidatesApi } from '@/features/candidates/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Badge } from '@/components/ui/badge'

function formatFileSize(size: number, t: (key: string) => string) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} ${t('KB')}`
  return `${(size / (1024 * 1024)).toFixed(1)} ${t('MB')}`
}

function UploadStatusBadge({ status }: { status: Cv['uploadStatus'] }) {
  const { t } = useTranslation()
  if (status === 'Uploaded') return null
  if (status === 'Failed') return <Badge variant='destructive'>{t('Cloud upload failed')}</Badge>
  return <Badge variant='secondary'>{t('Uploading to cloud…')}</Badge>
}

function UploadCvForm({ onSubmit }: { onSubmit: (data: { file: File }) => void }) {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)

  return (
    <form
      id='cv-upload-form'
      className='space-y-4'
      onSubmit={(e) => {
        e.preventDefault()
        if (!file) return
        onSubmit({ file })
      }}
    >
      <LinkedinPdfGuide />
      <div className='space-y-1'>
        <Label>{t('File')} *</Label>
        <Input
          type='file'
          accept='.pdf,.doc,.docx'
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
    </form>
  )
}

const PAGE_SIZE = 10

export function Cvs() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<Cv | null>(null)
  const [page, setPage] = useState(1)

  const { data: candidatesResult, isLoading: candidateLoading } = useQuery({
    queryKey: ['candidates', 'me'],
    queryFn: () => candidatesApi.mine(),
  })
  const candidate = candidatesResult?.items[0]

  const { data: cvsResult, isLoading: cvsLoading } = useQuery({
    queryKey: ['cvs', candidate?.id, page],
    queryFn: () => cvsApi.list({ candidateId: candidate?.id, page, pageSize: PAGE_SIZE }),
    enabled: !!candidate,
    placeholderData: (previousData) => previousData,
  })
  const cvs = cvsResult?.items
  const total = cvsResult?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const upload = useMutation({
    mutationFn: (data: { file: File }) => cvsApi.upload({ candidateId: candidate!.id, file: data.file }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cvs'] })
      toast.success(t('CV uploaded'))
      setDialogOpen(false)
      setPage(1)
    },
    onError: () => toast.error(t('Failed to upload CV')),
  })

  const remove = useMutation({
    mutationFn: cvsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cvs'] })
      toast.success(t('CV deleted'))
      setDeleting(null)
      if (cvs?.length === 1 && page > 1) setPage(page - 1)
    },
    onError: () => toast.error(t('Failed to delete CV')),
  })

  const isLoading = candidateLoading || cvsLoading

  if (!candidateLoading && !candidate) {
    return (
      <div className='rounded-md border py-12 text-center text-muted-foreground'>
        {t('No candidate profile found for your account yet.')}
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-end'>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className='h-4 w-4 me-1' /> {t('Upload CV')}
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('File')}</TableHead>
              <TableHead>{t('Size')}</TableHead>
              <TableHead>{t('Uploaded')}</TableHead>
              <TableHead className='w-20' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4}><Skeleton className='h-8 w-full' /></TableCell>
              </TableRow>
            )}
            {!isLoading && cvs?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className='text-center text-muted-foreground py-8'>{t('No CVs uploaded yet.')}</TableCell>
              </TableRow>
            )}
            {cvs?.map((cv) => (
              <TableRow key={cv.id}>
                <TableCell className='font-medium'>
                  <div className='flex items-center gap-2'>
                    <FileText className='h-4 w-4 text-muted-foreground' />
                    {cv.fileName}
                    <UploadStatusBadge status={cv.uploadStatus} />
                  </div>
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>{formatFileSize(cv.fileSizeBytes, t)}</TableCell>
                <TableCell className='text-sm text-muted-foreground'>{format(new Date(cv.uploadedDate), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <div className='flex items-center justify-end gap-1'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8'
                      title={t('View')}
                      aria-label={t('View')}
                      onClick={() => viewCvFile(cv)}
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='h-8 w-8' aria-label={t('Actions')}>
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => viewCvFile(cv)}>
                          <Eye className='h-4 w-4 me-2' /> {t('View')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadCvFile(cv)}>
                          <Download className='h-4 w-4 me-2' /> {t('Download')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className='text-destructive' onClick={() => setDeleting(cv)}>
                          <Trash2 className='h-4 w-4 me-2' /> {t('Delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <div className='flex items-center justify-between'>
          <p className='text-sm text-muted-foreground'>
            {t('Page {{page}} of {{totalPages}} ({{total}} {{unit}})', {
              page,
              totalPages,
              total,
              unit: total === 1 ? t('CV') : t('CVs'),
            })}
          </p>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className='h-4 w-4 me-1 rtl:rotate-180' /> {t('Previous')}
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              {t('Next')} <ChevronRight className='h-4 w-4 ms-1 rtl:rotate-180' />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>{t('Upload CV')}</DialogTitle>
          </DialogHeader>
          <UploadCvForm onSubmit={(data) => upload.mutate(data)} />
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>{t('Cancel')}</Button>
            <Button type='submit' form='cv-upload-form' disabled={upload.isPending}>
              {t('Upload')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('Delete CV')}
        desc={t('Are you sure you want to delete "{{name}}"? This cannot be undone.', { name: deleting?.fileName })}
        destructive
        confirmText={t('Delete')}
        isLoading={remove.isPending}
        handleConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  )
}
