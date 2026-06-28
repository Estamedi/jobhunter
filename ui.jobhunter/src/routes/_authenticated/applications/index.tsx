import { createFileRoute } from '@tanstack/react-router'
import { Applications } from '@/features/applications'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

function ApplicationsPage() {
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
          <h1 className='text-2xl font-bold tracking-tight'>Applications</h1>
          <p className='text-muted-foreground text-sm'>All job applications across all candidates</p>
        </div>
        <Applications />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/applications/')({
  component: ApplicationsPage,
})
