import {
  BadgeCheck,
  Bot,
  Boxes,
  CircleDashed,
  Code2,
  DatabaseZap,
  FileJson,
  GitBranch,
  Globe2,
  type LucideIcon,
  MonitorCheck,
  PlugZap,
  SearchCheck,
  ShieldCheck,
  Store,
  Webhook,
} from 'lucide-react'

export type OnboardingStep = {
  title: string
  description: string
  status: 'done' | 'current' | 'next'
  icon: LucideIcon
}

export type IntegrationOption = {
  title: string
  description: string
  badge: string
  icon: LucideIcon
}

export type ReadinessItem = {
  title: string
  description: string
}

export type PipelineStage = {
  title: string
  description: string
  icon: LucideIcon
}

export const onboardingSteps: OnboardingStep[] = [
  {
    title: 'Verify seller profile',
    description:
      'Confirm website ownership, business contact, and crawling limits.',
    status: 'done',
    icon: ShieldCheck,
  },
  {
    title: 'Choose ingestion method',
    description: 'Connect a plugin, API feed, sitemap, or fallback crawler.',
    status: 'current',
    icon: PlugZap,
  },
  {
    title: 'Preview product contract',
    description:
      'Validate fields before data starts flowing into matching and search.',
    status: 'next',
    icon: FileJson,
  },
  {
    title: 'Start monitored indexing',
    description:
      'Queue discovery, extraction, normalization, matching, and indexing.',
    status: 'next',
    icon: MonitorCheck,
  },
]

export const integrationOptions: IntegrationOption[] = [
  {
    title: 'WooCommerce plugin',
    description:
      'Best for structured product data, webhook updates, and token checks.',
    badge: 'Recommended',
    icon: Code2,
  },
  {
    title: 'Product feed or API',
    description:
      'Use a stable JSON/XML contract when a store already exports catalog data.',
    badge: 'Reliable',
    icon: DatabaseZap,
  },
  {
    title: 'Sitemap discovery',
    description:
      'Find product URLs quickly, then extract normalized offer events.',
    badge: 'Simple',
    icon: SearchCheck,
  },
  {
    title: 'HTML crawler fallback',
    description:
      'Works for custom stores, but needs parser monitoring and throttling.',
    badge: 'Fallback',
    icon: Bot,
  },
]

export const readinessItems: ReadinessItem[] = [
  {
    title: 'Product URL source',
    description: 'Sitemap, feed endpoint, API endpoint, or crawler seed URLs.',
  },
  {
    title: 'Offer fields',
    description:
      'Title, price, availability, image, product URL, category, and attributes.',
  },
  {
    title: 'Freshness signal',
    description: 'Webhook for fast changes plus polling as a safety net.',
  },
  {
    title: 'Review path',
    description:
      'Ambiguous matching is sent to human review before reaching search.',
  },
]

export const pipelineStages: PipelineStage[] = [
  {
    title: 'Discovery',
    description:
      'Collect product URLs from plugin, API, sitemap, feed, or crawler seeds.',
    icon: Globe2,
  },
  {
    title: 'Extraction',
    description:
      'Read seller offer details and turn raw pages into product events.',
    icon: Store,
  },
  {
    title: 'Normalize',
    description:
      'Clean titles, prices, stock states, categories, and attributes.',
    icon: BadgeCheck,
  },
  {
    title: 'Match',
    description:
      'Attach seller offers to canonical products or create review tasks.',
    icon: GitBranch,
  },
  {
    title: 'Index',
    description: 'Publish read-optimized search documents for fast serving.',
    icon: Boxes,
  },
  {
    title: 'Refresh',
    description: 'Use webhook and adaptive polling to keep prices trustworthy.',
    icon: Webhook,
  },
]

export const statusConfig = {
  done: {
    label: 'Complete',
    className:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  current: {
    label: 'In progress',
    className: 'border-primary/30 bg-primary/10 text-primary',
  },
  next: {
    label: 'Next',
    className: 'border-muted bg-muted text-muted-foreground',
  },
} satisfies Record<
  OnboardingStep['status'],
  { label: string; className: string }
>

export const PlaceholderIcon = CircleDashed
