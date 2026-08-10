import { type SVGProps } from 'react'
import { cn } from '@/lib/utils'

export function IconLinkedin({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role='img'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      className={cn('[&>path]:stroke-current', className)}
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    >
      <title>LinkedIn</title>
      <path strokeWidth='0' d='M0 0h24v24H0z' fill='none' />
      <path d='M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z' />
      <path d='M8 11l0 5' />
      <path d='M8 8l0 .01' />
      <path d='M12 16l0 -5' />
      <path d='M16 16v-3a2 2 0 0 0 -4 0' />
    </svg>
  )
}
