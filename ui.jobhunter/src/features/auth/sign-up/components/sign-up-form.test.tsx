import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type Locator, userEvent } from 'vitest/browser'
import { SignUpForm } from './sign-up-form'

const FORM_MESSAGES = {
  emailEmpty: 'Please enter your email.',
  passwordEmpty: 'Please enter your password.',
  confirmPasswordEmpty: 'Please confirm your password.',
  passwordMismatch: "Passwords don't match.",
} as const

const {
  navigate,
  setUserMock,
  setAccessTokenMock,
  axiosPostMock,
  isAxiosErrorMock,
  toastSuccessMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  navigate: vi.fn(),
  setUserMock: vi.fn(),
  setAccessTokenMock: vi.fn(),
  axiosPostMock: vi.fn(),
  isAxiosErrorMock: vi.fn(() => false),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    post: axiosPostMock,
    isAxiosError: isAxiosErrorMock,
  },
}))

// authApi pulls in the shared axios instance, which this test's axios mock does not provide.
// A failing `me` call exercises the form's fallback to the typed email.
vi.mock('@/features/auth/api', () => ({
  authApi: { me: vi.fn().mockRejectedValue(new Error('no profile')) },
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    auth: {
      setUser: setUserMock,
      setAccessToken: setAccessTokenMock,
    },
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}))

describe('SignUpForm', () => {
  let screen: RenderResult
  let emailInput: Locator
  let passwordInput: Locator
  let confirmPasswordInput: Locator
  let submitButton: Locator

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:5124')
    axiosPostMock.mockResolvedValue({
      data: { accessToken: 'mock-access-token', tokenType: 'Bearer' },
    })

    screen = await render(<SignUpForm />)
    emailInput = screen.getByRole('textbox', { name: /^Email$/i })
    passwordInput = screen.getByLabelText(/^Password$/i)
    confirmPasswordInput = screen.getByLabelText(/^Confirm Password$/i)
    submitButton = screen.getByRole('button', { name: /^Create Account$/i })
  })

  it('renders fields and submit button', async () => {
    await expect.element(emailInput).toBeInTheDocument()
    await expect.element(passwordInput).toBeInTheDocument()
    await expect.element(confirmPasswordInput).toBeInTheDocument()
    await expect.element(submitButton).toBeInTheDocument()
  })

  it('shows validation messages when submitting empty form', async () => {
    await userEvent.click(submitButton)

    await expect
      .element(screen.getByText(FORM_MESSAGES.emailEmpty))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(FORM_MESSAGES.passwordEmpty))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(FORM_MESSAGES.confirmPasswordEmpty))
      .toBeInTheDocument()
  })

  it('shows a mismatch error when passwords do not match', async () => {
    await userEvent.fill(emailInput, 'a@b.com')
    await userEvent.fill(passwordInput, '1234567')
    await userEvent.fill(confirmPasswordInput, '7654321')

    await userEvent.click(submitButton)
    await expect
      .element(screen.getByText(FORM_MESSAGES.passwordMismatch))
      .toBeInTheDocument()
  })

  it('registers and sends the user to confirm their email', async () => {
    axiosPostMock.mockResolvedValueOnce({ data: {} })

    await userEvent.fill(emailInput, 'a@b.com')
    await userEvent.fill(passwordInput, '1234567')
    await userEvent.fill(confirmPasswordInput, '1234567')

    await userEvent.click(submitButton)

    await vi.waitFor(() => expect(axios.post).toHaveBeenCalledOnce())
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:5124/api/Users/register',
      { email: 'a@b.com', password: '1234567' },
      { headers: { 'Content-Type': 'application/json' } }
    )
    expect(toastSuccessMock).toHaveBeenCalledWith(
      'Account created for a@b.com.'
    )
    expect(navigate).toHaveBeenCalledWith({
      to: '/register-complete',
      search: { email: 'a@b.com' },
      replace: true,
    })
    // The account must be confirmed before it can sign in, so nothing is stored yet.
    expect(setAccessTokenMock).not.toHaveBeenCalled()
  })

  it('disables submit while the registration request is pending', async () => {
    let resolveRegister!: (value: { data: Record<string, never> }) => void
    const registerPromise = new Promise<{ data: Record<string, never> }>(
      (resolve) => {
        resolveRegister = resolve
      }
    )

    axiosPostMock.mockReturnValueOnce(registerPromise)

    await userEvent.fill(emailInput, 'a@b.com')
    await userEvent.fill(passwordInput, '1234567')
    await userEvent.fill(confirmPasswordInput, '1234567')

    await userEvent.click(submitButton)
    await expect.element(submitButton).toBeDisabled()

    resolveRegister({ data: {} })
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledOnce())
    await expect.element(submitButton).toBeEnabled()
  })

  it('shows backend validation errors when registration fails', async () => {
    isAxiosErrorMock.mockReturnValue(true)
    axiosPostMock.mockRejectedValueOnce({
      response: {
        data: {
          errors: {
            DuplicateEmail: ['Email is already taken.'],
          },
        },
      },
    })

    await userEvent.fill(emailInput, 'a@b.com')
    await userEvent.fill(passwordInput, '1234567')
    await userEvent.fill(confirmPasswordInput, '1234567')

    await userEvent.click(submitButton)

    await vi.waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith('Email is already taken.')
    )
    expect(axios.post).toHaveBeenCalledTimes(1)
    expect(setAccessTokenMock).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
})
