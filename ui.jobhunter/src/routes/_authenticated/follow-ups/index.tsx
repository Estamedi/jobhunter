import { createFileRoute } from '@tanstack/react-router'
import { FollowUps } from '@/features/follow-ups'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

function FollowUpsPage() {
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
          <h1 className='text-2xl font-bold tracking-tight'>Follow-Ups</h1>
          <p className='text-muted-foreground text-sm'>Applications that need attention today, overdue, or this week</p>
        </div>
        <FollowUps />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/follow-ups/')({
  component: FollowUpsPage,
})
