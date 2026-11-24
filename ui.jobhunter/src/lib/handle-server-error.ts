import { AxiosError } from 'axios'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { getApiErrorMessage } from '@/lib/api-error'

export function handleServerError(error: unknown) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(error)
  }

  let errMsg = i18n.t('Something went wrong!')

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = i18n.t('No content.')
  }

  if (error instanceof AxiosError) {
    errMsg = getApiErrorMessage(error, errMsg)
  }

  toast.error(errMsg)
}
