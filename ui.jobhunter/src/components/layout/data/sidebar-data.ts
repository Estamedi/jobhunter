import {
  LayoutDashboard,
  Users,
  Building2,
  Contact2,
  Briefcase,
  FileText,
  MessageSquare,
  Calendar,
  BarChart3,
  Settings,
  UserCog,
  Palette,
  Bell,
  ClipboardCheck,
  Monitor,
  Wrench,
  AlertCircle,
  Files,
  StickyNote,
  Tag,
} from 'lucide-react'
import { type NavGroup, type SidebarData } from '../types'

/** Job seeker accounts only get a flat, minimal menu. */
const jobSeekerNavGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/',
        icon: LayoutDashboard,
      },
      {
        title: 'Applications',
        url: '/applications',
        icon: FileText,
      },
      {
        title: 'Vacancies',
        url: '/job-roles',
        icon: Briefcase,
      },
      {
        title: 'CVs',
        url: '/cvs',
        icon: Files,
      },
      {
        title: 'Notes',
        url: '/notes',
        icon: StickyNote,
      },
    ],
  },
]

const defaultNavGroups: NavGroup[] = [
  {
    title: 'Menu',
    items: [
      {
        title: 'Dashboard',
        url: '/',
        icon: LayoutDashboard,
      },
      {
        title: 'Onboarding',
        url: '/onboarding',
        icon: ClipboardCheck,
      },
      {
        title: 'Reports',
        url: '/reports',
        icon: BarChart3,
      },
      {
        title: 'Candidates',
        url: '/candidates',
        icon: Users,
      },
      {
        title: 'Companies',
        url: '/companies',
        icon: Building2,
      },
      {
        title: 'Contacts',
        url: '/contacts',
        icon: Contact2,
      },
      {
        title: 'Vacancies',
        url: '/job-roles',
        icon: Briefcase,
      },
      {
        title: 'Job Titles',
        url: '/job-titles',
        icon: Tag,
      },
      {
        title: 'All Applications',
        url: '/applications',
        icon: FileText,
      },
      {
        title: 'CVs',
        url: '/cvs',
        icon: Files,
      },
      {
        title: 'Follow-Ups',
        url: '/follow-ups',
        icon: AlertCircle,
      },
      {
        title: 'Activities',
        url: '/activities',
        icon: MessageSquare,
      },
      {
        title: 'Interviews',
        url: '/interviews',
        icon: Calendar,
      },
      {
        title: 'Settings',
        icon: Settings,
        items: [
          {
            title: 'Profile',
            url: '/settings',
            icon: UserCog,
          },
          {
            title: 'Account',
            url: '/settings/account',
            icon: Wrench,
          },
          {
            title: 'Appearance',
            url: '/settings/appearance',
            icon: Palette,
          },
          {
            title: 'Notifications',
            url: '/settings/notifications',
            icon: Bell,
          },
          {
            title: 'Display',
            url: '/settings/display',
            icon: Monitor,
          },
        ],
      },
    ],
  },
]

export const sidebarData: SidebarData = {
  user: {
    name: 'Job Hunter',
    email: 'user@jobhunter.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Job Hunter CRM',
      logo: Briefcase,
      plan: 'Job Search Manager',
    },
  ],
  navGroups: defaultNavGroups,
}

/** Returns the nav groups a user should see based on their role(s). */
export function getNavGroups(roles: string[] = []): NavGroup[] {
  if (roles.some((role) => role.toLowerCase() === 'jobseeker'))
    return jobSeekerNavGroups
  return defaultNavGroups
}
