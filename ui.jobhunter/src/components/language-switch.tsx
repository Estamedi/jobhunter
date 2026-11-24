import {
  LANGUAGES,
  type Language,
  getLanguageDir,
  persistLanguage,
} from '@/i18n'
import { Check, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useDirection } from '@/context/direction-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  const { setDir } = useDirection()

  const change = (lang: Language) => {
    void i18n.changeLanguage(lang)
    persistLanguage(lang)
    setDir(getLanguageDir(lang))
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='scale-95 rounded-full'>
          <Languages className='size-[1.2rem]' />
          <span className='sr-only'>{t('Change language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {LANGUAGES.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => change(l.code)}>
            {l.label}
            <Check
              size={14}
              className={cn('ms-auto', i18n.language !== l.code && 'hidden')}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
