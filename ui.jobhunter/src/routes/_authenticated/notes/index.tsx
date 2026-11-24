import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Notes } from '@/features/notes'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

function NotesPage() {
  const { t } = useTranslation()
  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className='mb-4'>
          <h1 className='text-2xl font-bold tracking-tight'>{t('Notes')}</h1>
          <p className='text-muted-foreground text-sm'>{t('Jot down and manage notes, optionally linked to applications')}</p>
        </div>
        <Notes />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/notes/')({
  component: NotesPage,
})
