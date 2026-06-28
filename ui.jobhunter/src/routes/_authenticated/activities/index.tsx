import { createFileRoute } from '@tanstack/react-router'
import { Activities } from '@/features/activities'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

function ActivitiesPage() {
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
          <h1 className='text-2xl font-bold tracking-tight'>Activities</h1>
          <p className='text-muted-foreground text-sm'>Logged calls, emails, meetings, and notes</p>
        </div>
        <Activities />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/activities/')({
  component: ActivitiesPage,
})
