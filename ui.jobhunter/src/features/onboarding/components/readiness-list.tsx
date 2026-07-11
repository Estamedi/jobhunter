import { CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type ReadinessItem } from '../data/onboarding-data'

type ReadinessListProps = {
  items: ReadinessItem[]
}

export function ReadinessList({ items }: ReadinessListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Before indexing starts</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {items.map((item) => (
          <div key={item.title} className='flex gap-3'>
            <CheckCircle2 className='mt-0.5 size-4 shrink-0 text-emerald-500' />
            <div>
              <p className='text-sm font-medium'>{item.title}</p>
              <p className='mt-1 text-xs leading-5 text-muted-foreground'>
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
