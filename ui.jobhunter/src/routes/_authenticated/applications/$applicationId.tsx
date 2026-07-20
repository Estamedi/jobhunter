import { createFileRoute } from '@tanstack/react-router'
import { ApplicationDetail } from '@/features/applications/components/application-detail'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

function ApplicationDetailPage() {
  const { applicationId } = Route.useParams()

  return (
    <>
      <Header>
        <div className='ml-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <ApplicationDetail applicationId={Number(applicationId)} />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/applications/$applicationId')({
  component: ApplicationDetailPage,
})
