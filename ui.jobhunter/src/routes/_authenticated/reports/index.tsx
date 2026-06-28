import { createFileRoute } from '@tanstack/react-router'
import { Reports } from '@/features/reports'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

function ReportsPage() {
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
          <h1 className='text-2xl font-bold tracking-tight'>Reports</h1>
          <p className='text-muted-foreground text-sm'>Analytics and statistics across your job search</p>
        </div>
        <Reports />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/reports/')({
  component: ReportsPage,
})
