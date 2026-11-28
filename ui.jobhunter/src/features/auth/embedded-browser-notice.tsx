import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { isEmbeddedBrowser } from '@/features/auth/lib/embedded-browser'

/** Tells users inside an app's built-in browser to switch to Safari or Chrome before using Google sign-in. */
export function EmbeddedBrowserNotice() {
  const { t } = useTranslation()
  const [embedded] = useState(() => isEmbeddedBrowser())

  if (!embedded) return null

  return (
    <Alert className='mx-auto max-w-xs'>
      <TriangleAlert />
      <AlertDescription>
        {t(
          'Google sign-in does not work in this app’s built-in browser. Open this page in Safari or Chrome.'
        )}
      </AlertDescription>
    </Alert>
  )
}
