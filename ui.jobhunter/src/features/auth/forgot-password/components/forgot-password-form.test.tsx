import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { userEvent, type Locator } from 'vitest/browser'
import { ForgotPasswordForm } from './forgot-password-form'

const postMock = vi.hoisted(() => vi.fn())

vi.mock('axios', async (orig) => {
  const actual = await orig<typeof import('axios')>()
  return { ...actual, default: { ...actual.default, post: postMock } }
})

vi.mock('@tanstack/react-router', async (orig) => {
  const actual = await orig<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  }
})

describe('ForgotPasswordForm', () => {
  let screen: RenderResult
  let emailInput: Locator
  let continueButton: Locator

  beforeEach(async () => {
    vi.clearAllMocks()
    postMock.mockResolvedValue({ data: {} })

    screen = await render(<ForgotPasswordForm />)
    emailInput = screen.getByRole('textbox', { name: /^Email$/i })
    continueButton = screen.getByRole('button', { name: /^Continue$/i })
  })

  it('renders email field and continue button', async () => {
    await expect.element(emailInput).toBeInTheDocument()
    await expect.element(continueButton).toBeInTheDocument()
  })

  it('shows validation when submitting empty form', async () => {
    await userEvent.click(continueButton)
    await expect
      .element(screen.getByText(/^Please enter your email\.$/i))
      .toBeInTheDocument()
    expect(postMock).not.toHaveBeenCalled()
  })

  it('asks the server for a reset email and then tells the user to check their inbox', async () => {
    await userEvent.fill(emailInput, 'a@b.com')
    await userEvent.click(continueButton)

    await vi.waitFor(() => expect(postMock).toHaveBeenCalledTimes(1))
    expect(postMock.mock.calls[0][0]).toMatch(/\/api\/Users\/forgotPassword$/)
    expect(postMock.mock.calls[0][1]).toEqual({ email: 'a@b.com' })
    await expect
      .element(screen.getByText(/we sent a link to reset your password/i))
      .toBeInTheDocument()
  })
})
