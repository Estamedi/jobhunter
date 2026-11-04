// The CV templates the server can render. Every one has the same single-column layout and section order;
// they differ in colours and spacing. An id the server does not know is drawn as the classic look.
export const CV_TEMPLATES = [
  { id: 'classic', label: 'Classic' },
  { id: 'neutral', label: 'Classic for print' },
  { id: 'compact', label: 'Compact' },
  { id: 'photo', label: 'With photo' },
] as const

interface TemplateLook {
  vars: Record<string, string>
  fontSize: string
  lineHeight: string
  padding: string
  // Header with the photo on the left, labelled contact lines and a QR code of the profile link.
  photoHeader: boolean
}

const CLASSIC: TemplateLook = {
  vars: {
    '--cv-heading': '#4285F4',
    '--cv-company': '#1155CC',
    '--cv-name': '#353744',
    '--cv-muted': '#666666',
    '--cv-block': '12px',
  },
  fontSize: '12px',
  lineHeight: '1.35',
  padding: '40px 48px',
  photoHeader: false,
}

const NEUTRAL: TemplateLook = {
  ...CLASSIC,
  vars: {
    ...CLASSIC.vars,
    '--cv-heading': '#1F1F1F',
    '--cv-company': '#333333',
    '--cv-name': '#1F1F1F',
    '--cv-muted': '#404040',
  },
}

const COMPACT: TemplateLook = {
  ...NEUTRAL,
  vars: { ...NEUTRAL.vars, '--cv-block': '8px' },
  fontSize: '11.5px',
  lineHeight: '1.25',
  padding: '32px 38px',
}

const PHOTO: TemplateLook = { ...CLASSIC, photoHeader: true }

export function templateLook(id?: string | null): TemplateLook {
  if (id === 'photo') return PHOTO
  if (id === 'neutral') return NEUTRAL
  if (id === 'compact') return COMPACT
  return CLASSIC
}

export function templateLabel(id?: string | null): string {
  return CV_TEMPLATES.find((t) => t.id === id)?.label ?? CV_TEMPLATES[0].label
}
