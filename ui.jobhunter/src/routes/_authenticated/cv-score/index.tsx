import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { CvScore } from '@/features/cv-score'

function CvScorePage() {
  const { t } = useTranslation()
  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className='mb-4'>
          <h1 className='text-2xl font-bold tracking-tight'>{t('CV Score')}</h1>
          <p className='text-sm text-muted-foreground'>
            {t('See how strong each of your CVs is and exactly what to fix')}
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
