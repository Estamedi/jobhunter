export const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Wishlist: 'outline',
  Applied: 'secondary',
  Interview: 'default',
  Rejected: 'destructive',
}

export const FOLLOWUP_COLORS: Record<string, string> = {
  Overdue: 'text-destructive font-medium',
  DueToday: 'text-orange-500 font-medium',
  ThisWeek: 'text-yellow-600',
}

export const STATUSES = ['Wishlist', 'Applied', 'Interview', 'Rejected']

export const PRIORITIES = ['Low', 'High']

export const CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'JPY',
  'CNY',
  'INR',
  'CHF',
  'SEK',
  'AED',
  'OMR',
]

export function formatStatusLabel(status: string) {
  return status.replace(/([A-Z])/g, ' $1').trim()
}

export interface StageAccent {
  top: string
  dot: string
  tint: string
  ring: string
}

// Per-stage accent, keyed by position rather than the user's badge-variant choice — a richer
// palette than the 4 badge variants gives each stage a distinct identity at a glance. Shared
// between the kanban board columns and the pipeline stage picker so a stage reads the same
// color everywhere it appears.
export const STAGE_ACCENTS: StageAccent[] = [
  { top: 'border-t-violet-500', dot: 'bg-violet-500', tint: 'bg-violet-50 dark:bg-violet-500/10', ring: 'ring-violet-400/50' },
  { top: 'border-t-blue-500', dot: 'bg-blue-500', tint: 'bg-blue-50 dark:bg-blue-500/10', ring: 'ring-blue-400/50' },
  { top: 'border-t-emerald-500', dot: 'bg-emerald-500', tint: 'bg-emerald-50 dark:bg-emerald-500/10', ring: 'ring-emerald-400/50' },
  { top: 'border-t-amber-500', dot: 'bg-amber-500', tint: 'bg-amber-50 dark:bg-amber-500/10', ring: 'ring-amber-400/50' },
  { top: 'border-t-rose-500', dot: 'bg-rose-500', tint: 'bg-rose-50 dark:bg-rose-500/10', ring: 'ring-rose-400/50' },
  { top: 'border-t-cyan-500', dot: 'bg-cyan-500', tint: 'bg-cyan-50 dark:bg-cyan-500/10', ring: 'ring-cyan-400/50' },
  { top: 'border-t-orange-500', dot: 'bg-orange-500', tint: 'bg-orange-50 dark:bg-orange-500/10', ring: 'ring-orange-400/50' },
  { top: 'border-t-pink-500', dot: 'bg-pink-500', tint: 'bg-pink-50 dark:bg-pink-500/10', ring: 'ring-pink-400/50' },
]

export const UNKNOWN_STAGE_ACCENT: StageAccent = {
  top: 'border-t-muted-foreground/30',
  dot: 'bg-muted-foreground/40',
  tint: 'bg-muted',
  ring: 'ring-muted-foreground/30',
}
