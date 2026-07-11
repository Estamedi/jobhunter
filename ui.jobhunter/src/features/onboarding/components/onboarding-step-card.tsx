import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { type OnboardingStep, statusConfig } from '../data/onboarding-data'

type OnboardingStepCardProps = {
  step: OnboardingStep
  index: number
}

export function OnboardingStepCard({ step, index }: OnboardingStepCardProps) {
  const Icon = step.icon
  const status = statusConfig[step.status]

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-colors',
        step.status === 'current' && 'border-primary/40 bg-primary/5'
      )}
    >
      <CardContent className='flex gap-4 p-5'>
        <div className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground'>
          <Icon className='size-5' />
        </div>
        <div className='min-w-0 flex-1 space-y-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-xs font-medium text-muted-foreground'>
              Step {index + 1}
            </span>
            <Badge
              variant='outline'
              className={cn('text-xs', status.className)}
            >
              {status.label}
            </Badge>
          </div>
          <div>
            <h3 className='font-semibold'>{step.title}</h3>
            <p className='mt-1 text-sm text-muted-foreground'>
              {step.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
