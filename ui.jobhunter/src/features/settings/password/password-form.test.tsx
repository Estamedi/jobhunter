import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { PasswordForm } from './password-form'

const { setPasswordMock, setHasPasswordMock, toastSuccessMock, toastErrorMock } =
  vi.hoisted(() => ({
    setPasswordMock: vi.fn(),
    setHasPasswordMock: vi.fn(),
    toastSuccessMock: vi.fn(),
    toastErrorMock: vi.fn(),
  }))

let mockHasPassword = false

vi.mock('@/features/auth/api', () => ({
  authApi: { setPassword: setPasswordMock },
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    auth: {
      user: { hasPassword: mockHasPassword },
      setHasPassword: setHasPasswordMock,
    },
  }),
}))

vi.mock('sonner', () => ({
  toast: { success: toastSuccessMock, error: toastErrorMock },
}))

describe('PasswordForm', () => {
  let screen: RenderResult

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders only new/confirm password fields when the user has no password yet', async () => {
    mockHasPassword = false
    screen = await render(<PasswordForm />)

    await expect
      .element(screen.getByRole('button', { name: 'Set password' }))
      .toBeInTheDocument()
    expect(screen.getByLabelText('Current password').query()).toBeNull()
  })

  it('sets a password for the first time without requiring a current password', async () => {
    mockHasPassword = false
    setPasswordMock.mockResolvedValue({})
    screen = await render(<PasswordForm />)

    await userEvent.fill(screen.getByLabelText(/^New password$/), 'Passw0rd!123')
    await userEvent.fill(screen.getByLabelText('Confirm new password'), 'Passw0rd!123')
    await userEvent.click(screen.getByRole('button', { name: 'Set password' }))

    await vi.waitFor(() => expect(setPasswordMock).toHaveBeenCalledOnce())
    expect(setPasswordMock).toHaveBeenCalledWith('Passw0rd!123', undefined)
    await vi.waitFor(() => expect(setHasPasswordMock).toHaveBeenCalledWith(true))
    await vi.waitFor(() => expect(toastSuccessMock).toHaveBeenCalled())
  })

  it('requires the current password when the user already has one', async () => {
    mockHasPassword = true
    screen = await render(<PasswordForm />)

    await expect
      .element(screen.getByRole('button', { name: 'Update password' }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByLabelText('Current password'))
      .toBeInTheDocument()

    await userEvent.fill(screen.getByLabelText(/^New password$/), 'NewPassw0rd!456')
    await userEvent.fill(screen.getByLabelText('Confirm new password'), 'NewPassw0rd!456')
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }))

    await expect
      .element(screen.getByText('Please enter your current password.'))
      .toBeInTheDocument()
    expect(setPasswordMock).not.toHaveBeenCalled()
  })

  it('changes the password when the current password is provided', async () => {
    mockHasPassword = true
    setPasswordMock.mockResolvedValue({})
    screen = await render(<PasswordForm />)

    await userEvent.fill(screen.getByLabelText('Current password'), 'OldPassw0rd!123')
    await userEvent.fill(screen.getByLabelText(/^New password$/), 'NewPassw0rd!456')
    await userEvent.fill(screen.getByLabelText('Confirm new password'), 'NewPassw0rd!456')
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }))

    await vi.waitFor(() => expect(setPasswordMock).toHaveBeenCalledOnce())
    expect(setPasswordMock).toHaveBeenCalledWith('NewPassw0rd!456', 'OldPassw0rd!123')
  })
})
