import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { CrmDashboard } from '@/features/crm-dashboard'

function DashboardPage() {
  return (
    <>
      <Header>
        <div className='ml-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main
        fluid
        className='min-h-[calc(100svh-4rem)] bg-tapinti-page px-5 py-5'
      >
        <CrmDashboard />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
})
