export const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Wishlist: 'outline',
  Applied: 'secondary',
  PhoneScreen: 'default',
  HRInterview: 'default',
  TechnicalInterview: 'default',
  FinalInterview: 'default',
  Offer: 'default',
  Accepted: 'default',
  Rejected: 'destructive',
  Withdrawn: 'secondary',
  Ghosted: 'secondary',
}

export const FOLLOWUP_COLORS: Record<string, string> = {
  Overdue: 'text-destructive font-medium',
  DueToday: 'text-orange-500 font-medium',
  ThisWeek: 'text-yellow-600',
}

export const STATUSES = [
  'Wishlist',
  'Applied',
  'PhoneScreen',
  'HRInterview',
  'TechnicalInterview',
  'FinalInterview',
  'Offer',
  'Accepted',
  'Rejected',
  'Withdrawn',
  'Ghosted',
]

export const PRIORITIES = ['Low', 'Medium', 'High']

export function formatStatusLabel(status: string) {
  return status.replace(/([A-Z])/g, ' $1').trim()
}
