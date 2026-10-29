import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { CvScore } from '@/features/cv-score'

function CvScorePage() {
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
          <h1 className='text-2xl font-bold tracking-tight'>CV Score</h1>
          <p className='text-sm text-muted-foreground'>
            See how strong each of your CVs is and exactly what to fix
          </p>
        </div>
        <CvScore />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/cv-score/')({
  component: CvScorePage,
})
