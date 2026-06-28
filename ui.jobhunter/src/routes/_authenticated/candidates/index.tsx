import { createFileRoute } from '@tanstack/react-router'
import { Candidates } from '@/features/candidates'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

function CandidatesPage() {
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
          <h1 className='text-2xl font-bold tracking-tight'>Candidates</h1>
          <p className='text-muted-foreground text-sm'>Manage job seekers and their search profiles</p>
        </div>
        <Candidates />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/candidates/')({
  component: CandidatesPage,
})
