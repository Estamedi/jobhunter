import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Workers } from '@/features/workers'

function WorkersPage() {
  return (
    <>
      <Header>
        <div className='ml-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <Workers />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/workers/')({
  beforeLoad: () => {
    const role = useAuthStore.getState().auth.user?.role ?? []
    if (!role.some((r) => r.toLowerCase() === 'administrator')) {
      throw redirect({ to: '/' })
    }
  },
  component: WorkersPage,
})
