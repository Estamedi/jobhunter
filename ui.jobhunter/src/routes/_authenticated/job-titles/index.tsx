import { createFileRoute } from '@tanstack/react-router'
import { JobTitles } from '@/features/job-titles'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

function JobTitlesPage() {
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
          <h1 className='text-2xl font-bold tracking-tight'>Job Titles</h1>
          <p className='text-muted-foreground text-sm'>Normalized role catalog used for reporting across companies</p>
        </div>
        <JobTitles />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/job-titles/')({
  component: JobTitlesPage,
})
