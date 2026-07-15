import { createFileRoute } from '@tanstack/react-router'
import { Cvs } from '@/features/cvs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

function CvsPage() {
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
          <h1 className='text-2xl font-bold tracking-tight'>CVs</h1>
          <p className='text-muted-foreground text-sm'>Upload, download, and manage your CVs</p>
        </div>
        <Cvs />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/cvs/')({
  component: CvsPage,
})
