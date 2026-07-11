import { type ElementType } from 'react'
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'

type TeamSwitcherProps = {
  teams: {
    name: string
    logo: ElementType
    plan: string
  }[]
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const activeTeam = teams[0]

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className='flex h-[var(--sidebar-brand-height)] items-center gap-[var(--sidebar-item-gap)] text-sidebar-brand-foreground group-data-[collapsible=icon]:justify-center'>
          <div className='flex size-[var(--sidebar-brand-icon-size)] shrink-0 items-center justify-center rounded-[var(--sidebar-item-radius)] bg-sidebar-primary text-sidebar-primary-foreground'>
            <activeTeam.logo className='size-[var(--sidebar-brand-icon-inner-size)]' />
          </div>
          <div className='min-w-0 group-data-[collapsible=icon]:hidden'>
            <span className='block truncate text-sm leading-5 font-semibold tracking-[var(--sidebar-brand-letter-spacing)]'>
              {activeTeam.name}
            </span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
