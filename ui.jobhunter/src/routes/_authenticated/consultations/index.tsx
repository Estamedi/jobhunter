import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Consultations } from '@/features/consultations'

function ConsultationsPage() {
  return (
    <>
      <Header>
        <div className='ml-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <Consultations />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/consultations/')({
  beforeLoad: () => {
    const role = useAuthStore.getState().auth.user?.role ?? []
    if (!role.some((r) => r.toLowerCase() === 'administrator')) {
      throw redirect({ to: '/' })
    }
  },
  component: ConsultationsPage,
})
