import { Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { SidebarNav } from './components/sidebar-nav'
import { Bot, KeyRound } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

export function Settings() {
  const { t } = useTranslation()
  const isAdmin = useAuthStore((s) =>
    (s.auth.user?.role ?? []).some((r) => r.toLowerCase() === 'administrator')
  )
  const sidebarNavItems = [
    {
      title: t('Password'),
      href: '/settings/password',
      icon: <KeyRound size={18} />,
    },
  ]
  const navItems = isAdmin
    ? [
        ...sidebarNavItems,
        { title: t('AI provider'), href: '/settings/ai-provider', icon: <Bot size={18} /> },
      ]
    : sidebarNavItems
  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <Search className='me-auto' />
        <ThemeSwitch />
        {/* <ConfigDrawer /> */}
        <ProfileDropdown />
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            {t('Settings')}
          </h1>
          <p className='text-muted-foreground'>
            {t('Manage your account settings and set e-mail preferences.')}
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />
        <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:gap-x-12'>
          <aside className='top-0 lg:sticky lg:w-1/5'>
            <SidebarNav items={navItems} />
          </aside>
          <div className='flex w-full overflow-y-hidden p-1'>
            <Outlet />
          </div>
        </div>
      </Main>
    </>
  )
}
