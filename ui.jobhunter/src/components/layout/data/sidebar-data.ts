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
  Monitor,
  Wrench,
  AlertCircle,
} from 'lucide-react'
import { type SidebarData } from '../types'

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
  navGroups: [
    {
      title: 'Overview',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Reports',
          url: '/reports',
          icon: BarChart3,
        },
      ],
    },
    {
      title: 'CRM',
      items: [
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
          title: 'Job Roles',
          url: '/job-roles',
          icon: Briefcase,
        },
      ],
    },
    {
      title: 'Applications',
      items: [
        {
          title: 'All Applications',
          url: '/applications',
          icon: FileText,
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
      ],
    },
    {
      title: 'Other',
      items: [
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
  ],
}
