import { Card, CardContent } from '@/components/ui/card'
import { type PipelineStage } from '../data/onboarding-data'

type PipelineStageCardProps = {
  stage: PipelineStage
}

export function PipelineStageCard({ stage }: PipelineStageCardProps) {
  const Icon = stage.icon

  return (
    <Card className='border-dashed'>
      <CardContent className='p-4'>
        <div className='mb-3 flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
          <Icon className='size-4' />
        </div>
        <h3 className='text-sm font-semibold'>{stage.title}</h3>
        <p className='mt-2 text-xs leading-5 text-muted-foreground'>
          {stage.description}
        </p>
      </CardContent>
    </Card>
  )
}
