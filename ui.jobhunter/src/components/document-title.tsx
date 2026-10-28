import { useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'

const BRAND = 'ApplyLadder'

function titleFromPath(pathname: string) {
  const segment = pathname.split('/').filter(Boolean)[0]
  if (!segment) return BRAND
  const label = segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return `${label} · ${BRAND}`
}

export function DocumentTitle() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    document.title = titleFromPath(pathname)
  }, [pathname])

  return null
}
