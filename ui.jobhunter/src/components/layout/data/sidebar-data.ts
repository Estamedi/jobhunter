import {
  LayoutDashboard,
  Building2,
  Contact2,
  Briefcase,
  FileText,
  MessageSquare,
  Calendar,
  BarChart3,
  Settings,
  KeyRound,
  Palette,
  Bell,
  ClipboardCheck,
  Monitor,
  AlertCircle,
  Files,
  StickyNote,
  Tag,
  Sparkles,
  Gauge,
  UserRound,
  Users,
} from 'lucide-react'
import { Logo } from '@/assets/logo'
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
    ],
  },
  {
    title: 'Pipeline',
    items: [
      {
        title: 'Applications',
        url: '/applications',
        icon: FileText,
      },
      {
        title: 'Contacts',
        url: '/contacts',
        icon: Contact2,
      },
    ],
  },
  {
    title: 'Documents',
    items: [
      {
        title: 'CVs',
        url: '/cvs',
        icon: Files,
      },
      {
        title: 'CV Writer',
        url: '/cv-builder',
        icon: Sparkles,
      },
      {
        title: 'CV Score',
        url: '/cv-score',
        icon: Gauge,
      },
      {
        title: 'My Profile',
        url: '/profile',
        icon: UserRound,
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
    title: 'Pipeline',
    items: [
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
        title: 'Follow-Ups',
        url: '/follow-ups',
        icon: AlertCircle,
      },
      {
        title: 'Interviews',
        url: '/interviews',
        icon: Calendar,
      },
      {
        title: 'Activities',
        url: '/activities',
        icon: MessageSquare,
      },
    ],
  },
  {
    title: 'Network',
    items: [
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
    ],
  },
  {
    title: 'Documents',
    items: [
      {
        title: 'CVs',
        url: '/cvs',
        icon: Files,
      },
      {
        title: 'CV Writer',
        url: '/cv-builder',
        icon: Sparkles,
      },
      {
        title: 'CV Score',
        url: '/cv-score',
        icon: Gauge,
      },
      {
        title: 'My Profile',
        url: '/profile',
        icon: UserRound,
      },
    ],
  },
  {
    title: 'Setup',
    items: [
      {
        title: 'Onboarding',
        url: '/onboarding',
        icon: ClipboardCheck,
      },
      {
        title: 'Job Titles',
        url: '/job-titles',
        icon: Tag,
      },
      {
        title: 'Settings',
        icon: Settings,
        items: [
          {
            title: 'Password',
            url: '/settings/password',
            icon: KeyRound,
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

/** Administrators manage the platform: no personal CV/profile tools. */
const administratorNavGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', url: '/', icon: LayoutDashboard },
      { title: 'Reports', url: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Administration',
    items: [{ title: 'Registered Users', url: '/users', icon: Users }],
  },
  ...defaultNavGroups
    .filter((g) => g.title === 'Setup')
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => i.title !== 'Onboarding'),
    })),
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
      logo: Logo,
      plan: 'Job Search Manager',
    },
  ],
  navGroups: defaultNavGroups,
}

/** Returns the nav groups a user should see based on their role(s). */
export function getNavGroups(roles: string[] = []): NavGroup[] {
  if (roles.some((role) => role.toLowerCase() === 'administrator'))
    return administratorNavGroups
  if (roles.some((role) => role.toLowerCase() === 'jobseeker'))
    return jobSeekerNavGroups
  return defaultNavGroups
}
