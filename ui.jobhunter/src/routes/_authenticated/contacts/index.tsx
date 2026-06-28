import { createFileRoute } from '@tanstack/react-router'
import { Contacts } from '@/features/contacts'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

function ContactsPage() {
  return (
    <>
      <Header>
        <div className='ml-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className='mb-4'>
          <h1 className='text-2xl font-bold tracking-tight'>Contacts</h1>
          <p className='text-muted-foreground text-sm'>Recruiters, hiring managers, and connections</p>
        </div>
        <Contacts />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/contacts/')({
  component: ContactsPage,
})
