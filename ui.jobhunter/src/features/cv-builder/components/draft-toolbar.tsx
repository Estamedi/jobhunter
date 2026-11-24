import {
  ChevronDown,
  FileDown,
  History,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CV_TEMPLATES } from '../lib/templates'

// The actions for the open draft. Only Export and Edit are always in sight; the template, the history and
// delete sit under the "more" menu so the bar stays calm.
export function DraftToolbar({
  templateId,
  templateBusy,
  editing,
  exporting,
  onTemplate,
  onToggleEdit,
  onExport,
  onHistory,
  onDelete,
}: {
  templateId: string
  templateBusy: boolean
  editing: boolean
  exporting: boolean
  onTemplate: (id: string) => void
  onToggleEdit: () => void
  onExport: (format: 'pdf' | 'docx') => void
  onHistory: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className='flex items-center gap-2'>
      <Button variant='outline' size='sm' onClick={onToggleEdit}>
        <Pencil className='me-1 h-4 w-4' /> {editing ? t('Preview') : t('Edit')}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size='sm' disabled={exporting}>
            {exporting ? (
              <Loader2 className='me-1 h-4 w-4 animate-spin' />
            ) : (
              <FileDown className='me-1 h-4 w-4' />
            )}
            {t('Export')} <ChevronDown className='ms-1 h-3 w-3' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onSelect={() => onExport('pdf')}>
            {t('PDF (A4)')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onExport('docx')}>
            {t('Word document (DOCX)')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            className='h-8 w-8'
            aria-label={t('More actions')}
          >
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-56'>
          <DropdownMenuLabel>
            {t('Template')}
            <span className='block text-xs font-normal text-muted-foreground'>
              {t('Colours and spacing. The layout is the same.')}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={templateId}
            onValueChange={(v) => !templateBusy && onTemplate(v)}
          >
            {CV_TEMPLATES.map((tpl) => (
              <DropdownMenuRadioItem key={tpl.id} value={tpl.id}>
                {t(tpl.label)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onHistory}>
            <History /> {t('History')}
          </DropdownMenuItem>
          <DropdownMenuItem variant='destructive' onSelect={onDelete}>
            <Trash2 /> {t('Delete draft')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
