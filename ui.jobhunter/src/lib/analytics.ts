declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as
  | string
  | undefined

export function initAnalytics() {
  if (!measurementId || !import.meta.env.PROD || window.gtag) return

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // gtag.js requires the `arguments` object, not a rest array
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)
}

export function track(event: string, props?: Record<string, unknown>) {
  window.gtag?.('event', event, props)
}

export function trackPageView(path: string) {
  track('page_view', {
    page_path: path,
    page_location: window.location.href,
  })
}
