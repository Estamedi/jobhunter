import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Contacts } from '@/features/contacts'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

function ContactsPage() {
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
          <h1 className='text-2xl font-bold tracking-tight'>{t('Contacts')}</h1>
          <p className='text-muted-foreground text-sm'>{t('Recruiters, hiring managers, and connections')}</p>
        </div>
        <Contacts />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/contacts/')({
  component: ContactsPage,
})
