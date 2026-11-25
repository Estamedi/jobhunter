import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Applications } from '@/features/applications'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

const routeApi = getRouteApi('/_authenticated/applications/')

function ApplicationsPage() {
  const { t } = useTranslation()
  const { status } = routeApi.useSearch()
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
          <h1 className='text-2xl font-bold tracking-tight'>{t('Applications')}</h1>
          <p className='text-muted-foreground text-sm'>{t('All job applications across all candidates')}</p>
        </div>
        <Applications initialStatus={status} />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/applications/')({
  validateSearch: (search: Record<string, unknown>): { status?: string } => ({
    status: typeof search.status === 'string' ? search.status : undefined,
  }),
  component: ApplicationsPage,
})
