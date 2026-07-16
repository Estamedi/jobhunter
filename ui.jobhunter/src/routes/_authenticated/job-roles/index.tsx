import { createFileRoute } from '@tanstack/react-router'
import { JobRoles } from '@/features/job-roles'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

function JobRolesPage() {
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
          <h1 className='text-2xl font-bold tracking-tight'>Vacancies</h1>
          <p className='text-muted-foreground text-sm'>Open positions being tracked</p>
        </div>
        <JobRoles />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/job-roles/')({
  component: JobRolesPage,
})
