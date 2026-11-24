import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { ContentSection } from '../components/content-section'
import { PasswordForm } from './password-form'

export function SettingsPassword() {
  const { t } = useTranslation()
  const hasPassword = useAuthStore((state) => state.auth.user?.hasPassword ?? false)

  return (
    <ContentSection
      title={hasPassword ? t('Password') : t('Set a password')}
      desc={
        hasPassword
          ? t(
              'Update the password used to sign in with your email, including in the browser extension.'
            )
          : t(
              'You signed up with Google. Set a password so you can also sign in with your email, including from the browser extension.'
            )
      }
    >
      <PasswordForm />
    </ContentSection>
  )
}
