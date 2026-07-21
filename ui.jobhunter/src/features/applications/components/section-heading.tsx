import type { LucideIcon } from 'lucide-react'

interface SectionHeadingProps {
  icon: LucideIcon
  title: string
  action?: React.ReactNode
}

export function SectionHeading({ icon: Icon, title, action }: SectionHeadingProps) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <div className='flex items-center gap-3'>
        <div className='flex size-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400'>
          <Icon className='size-4' />
        </div>
        <h4 className='text-sm font-semibold'>{title}</h4>
      </div>
      {action}
    </div>
  )
}
