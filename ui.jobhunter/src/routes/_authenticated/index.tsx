import { createFileRoute } from '@tanstack/react-router'
import { CrmDashboard } from '@/features/crm-dashboard'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

function DashboardPage() {
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
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <p className='text-muted-foreground text-sm'>Job search overview across all candidates</p>
        </div>
        <CrmDashboard />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
})
