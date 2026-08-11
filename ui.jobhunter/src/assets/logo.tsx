import { type SVGProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * The Tapinti "fan" mark: three rounded-rect cards fanned out, two outlined
 * (the pile of applications) with the accent card in front (the live one).
 */
export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox='0 0 84 62'
      fill='none'
      aria-hidden='true'
      className={cn('size-6', className)}
      {...props}
    >
      <title>Tapinti</title>
      <rect
        x='3'
        y='13'
        width='50'
        height='36'
        rx='8'
        transform='rotate(-16 28 31)'
        className='fill-background stroke-foreground'
        strokeWidth='3'
      />
      <rect
        x='17'
        y='11.56'
        width='50'
        height='36'
        rx='8'
        transform='rotate(-2 42 29.56)'
        className='fill-background stroke-foreground'
        strokeWidth='3'
      />
      <rect
        x='31'
        y='14.44'
        width='50'
        height='36'
        rx='8'
        transform='rotate(13 56 32.44)'
        className='fill-primary'
      />
    </svg>
  )
}
