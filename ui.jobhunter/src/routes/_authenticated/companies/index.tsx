import { createFileRoute } from '@tanstack/react-router'
import { Companies } from '@/features/companies'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

function CompaniesPage() {
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
          <h1 className='text-2xl font-bold tracking-tight'>Companies</h1>
          <p className='text-muted-foreground text-sm'>Track target companies and their details</p>
        </div>
        <Companies />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/companies/')({
  component: CompaniesPage,
})
