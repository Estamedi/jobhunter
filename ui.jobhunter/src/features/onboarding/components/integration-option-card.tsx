import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { type IntegrationOption } from '../data/onboarding-data'

type IntegrationOptionCardProps = {
  option: IntegrationOption
}

export function IntegrationOptionCard({ option }: IntegrationOptionCardProps) {
  const Icon = option.icon

  return (
    <Card className='group transition-colors hover:border-primary/40 hover:bg-primary/5'>
      <CardContent className='space-y-4 p-5'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary'>
            <Icon className='size-5' />
          </div>
          <Badge variant='secondary'>{option.badge}</Badge>
        </div>
        <div>
          <h3 className='font-semibold'>{option.title}</h3>
          <p className='mt-2 text-sm leading-6 text-muted-foreground'>
            {option.description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
