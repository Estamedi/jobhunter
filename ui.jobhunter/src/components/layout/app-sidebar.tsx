import { useLayout } from '@/context/layout-provider'
import { useAuthStore } from '@/stores/auth-store'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
// import { AppTitle } from './app-title'
import { getNavGroups, sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const role = useAuthStore((state) => state.auth.user?.role)
  const navGroups = getNavGroups(role)
  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader className='h-[var(--sidebar-header-height)] shrink-0 justify-center border-b border-sidebar-border px-[var(--sidebar-brand-padding-x)] py-[var(--sidebar-brand-padding-y)] group-data-[collapsible=icon]:px-[var(--sidebar-section-padding-x)]'>
        <TeamSwitcher teams={sidebarData.teams} />

        {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
        {/* <AppTitle /> */}
      </SidebarHeader>
      <SidebarContent className='gap-0 px-[var(--sidebar-section-padding-x)] py-[var(--sidebar-section-padding-y)]'>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter className='border-t border-sidebar-border px-[var(--sidebar-section-padding-x)] py-[var(--sidebar-section-padding-y)]'>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
