import { createFileRoute } from '@tanstack/react-router'
import { Interviews } from '@/features/interviews'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

function InterviewsPage() {
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
          <h1 className='text-2xl font-bold tracking-tight'>Interviews</h1>
          <p className='text-muted-foreground text-sm'>Scheduled and past interviews</p>
        </div>
        <Interviews />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/interviews/')({
  component: InterviewsPage,
})
