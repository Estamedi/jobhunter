import { useAuthStore } from '@/stores/auth-store'
import { ContentSection } from '../components/content-section'
import { PasswordForm } from './password-form'

export function SettingsPassword() {
  const hasPassword = useAuthStore((state) => state.auth.user?.hasPassword ?? false)

  return (
    <ContentSection
      title={hasPassword ? 'Password' : 'Set a password'}
      desc={
        hasPassword
          ? 'Update the password used to sign in with your email, including in the browser extension.'
          : 'You signed up with Google. Set a password so you can also sign in with your email, including from the browser extension.'
      }
    >
      <PasswordForm />
    </ContentSection>
  )
}
