import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type Locator, userEvent } from 'vitest/browser'
import axios from 'axios'
import { UserAuthForm } from './user-auth-form'

const FORM_MESSAGES = {
  emailEmpty: 'Please enter your email.',
  passwordEmpty: 'Please enter your password.',
  passwordShort: 'Password must be at least 7 characters long.',
} as const

const { navigate, setUserMock, setAccessTokenMock, axiosPostMock } = vi.hoisted(
  () => ({
    navigate: vi.fn(),
    setUserMock: vi.fn(),
    setAccessTokenMock: vi.fn(),
    axiosPostMock: vi.fn(),
  })
)

vi.mock('axios', () => ({
  default: {
    post: axiosPostMock,
    isAxiosError: vi.fn(() => false),
  },
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    auth: {
      setUser: setUserMock,
      setAccessToken: setAccessTokenMock,
    },
  }),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigate,
    Link: ({
      children,
      to,
      className,
      ...rest
    }: {
      children?: React.ReactNode
      to: string
      className?: string
    }) => (
      <a href={to} className={className} {...rest}>
        {children}
      </a>
    ),
  }
})

vi.mock('@/lib/utils', async (orig) => ({
  ...(await orig()),
  sleep: vi.fn(() => Promise.resolve()),
}))

describe('UserAuthForm', () => {
  describe('Rendering without redirectTo', () => {
    let screen: RenderResult
    let emailInput: Locator
    let passwordInput: Locator
    let signInButton: Locator
    let forgotPasswordLink: Locator

    beforeEach(async () => {
      vi.clearAllMocks()
      axiosPostMock.mockResolvedValue({
        data: { accessToken: 'mock-access-token', tokenType: 'Bearer' },
      })
      screen = await render(<UserAuthForm />)
      emailInput = screen.getByRole('textbox', { name: /^Email$/i })
      passwordInput = screen.getByLabelText(/^Password$/i)
      signInButton = screen.getByRole('button', { name: /^Sign in$/i })
      forgotPasswordLink = screen.getByText(/^Forgot password\?$/i)
    })

    it('renders fields, submit button, and forgot password link', async () => {
      await expect.element(emailInput).toBeInTheDocument()
      await expect.element(passwordInput).toBeInTheDocument()
      await expect.element(signInButton).toBeInTheDocument()
      await expect.element(forgotPasswordLink).toBeInTheDocument()
    })

    it('shows validation messages when submitting empty form', async () => {
      await userEvent.click(signInButton)

      await expect
        .element(screen.getByText(FORM_MESSAGES.emailEmpty))
        .toBeInTheDocument()
      await expect
        .element(screen.getByText(FORM_MESSAGES.passwordEmpty))
        .toBeInTheDocument()
    })

    it('authenticates and navigates to default route on success', async () => {
      await userEvent.fill(emailInput, 'a@b.com')
      await userEvent.fill(passwordInput, '1234567')

      await userEvent.click(signInButton)

      await vi.waitFor(() => expect(setUserMock).toHaveBeenCalledOnce())
      expect(setUserMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'a@b.com',
          accountNo: expect.any(String),
          role: expect.any(Array),
          exp: expect.any(Number),
        })
      )
      expect(setAccessTokenMock).toHaveBeenCalledOnce()
      expect(setAccessTokenMock).toHaveBeenCalledWith('mock-access-token')

      await vi.waitFor(() =>
        expect(navigate).toHaveBeenCalledWith({ to: '/', replace: true })
      )
    })
  })

  it('navigates to redirectTo when provided', async () => {
    vi.clearAllMocks()
    axiosPostMock.mockResolvedValue({
      data: { accessToken: 'mock-access-token', tokenType: 'Bearer' },
    })

    const { getByRole, getByLabelText } = await render(
      <UserAuthForm redirectTo='/settings' />
    )

    await userEvent.fill(getByRole('textbox', { name: /Email/i }), 'a@b.com')
    await userEvent.fill(getByLabelText('Password'), '1234567')

    await userEvent.click(getByRole('button', { name: /Sign in/i }))

    await vi.waitFor(() => expect(setUserMock).toHaveBeenCalledOnce())
    expect(setAccessTokenMock).toHaveBeenCalledOnce()

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/settings',
        replace: true,
      })
    )
  })

  it('exchanges the Google token and navigates on success', async () => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'google-client-id')
    axiosPostMock.mockResolvedValue({
      data: { accessToken: 'google-access-token', tokenType: 'Bearer' },
    })
    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn((options) => ({
            requestAccessToken: vi.fn(() => {
              options.callback({ access_token: 'google-id-token' })
            }),
          })),
        },
      },
    }

    const { getByRole } = await render(<UserAuthForm />)

    await userEvent.click(getByRole('button', { name: /Continue with Google/i }))

    await vi.waitFor(() => expect(axios.post).toHaveBeenCalledOnce())
    expect(axios.post).toHaveBeenCalledWith(
      'undefined/api/Users/google-login',
      { idToken: 'google-id-token' },
      { headers: { 'Content-Type': 'application/json' } }
    )
    expect(setAccessTokenMock).toHaveBeenCalledWith('google-access-token')
    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/', replace: true })
    )
  })
})
