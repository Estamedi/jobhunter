// The profile link the photo header shows as a QR code and as text: LinkedIn if there is one, otherwise the
// first link. The server picks it the same way, so the preview and the PDF agree.
export function pickHeaderLink(links: string[]): string | null {
  return (
    links.find((l) => l.toLowerCase().includes('linkedin.com')) ??
    links.find((l) => l.trim().length > 0) ??
    null
  )
}

export function headerLinkLabel(link: string): string {
  return link.toLowerCase().includes('linkedin.com') ? 'LinkedIn' : 'Link'
}

// The link as shown: without the protocol and a closing slash.
export function headerLinkText(link: string): string {
  return link
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '')
}

export function headerLinkUrl(link: string): string {
  return /^https?:\/\//i.test(link) ? link : `https://${link}`
}
