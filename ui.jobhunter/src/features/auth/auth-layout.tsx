import { Logo } from '@/assets/logo'
import { LanguageSwitch } from '@/components/language-switch'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='relative container grid h-svh max-w-none items-center justify-center'>
      <div className='absolute end-4 top-4'>
        <LanguageSwitch />
      </div>
      <div className='mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:p-8'>
        <div className='mb-4 flex items-center justify-center'>
          <Logo className='me-2 size-8' />
          <h1 className='font-archivo text-xl font-semibold tracking-wide uppercase'>
            ApplyLadder
          </h1>
        </div>
        {children}
      </div>
    </div>
  )
}
