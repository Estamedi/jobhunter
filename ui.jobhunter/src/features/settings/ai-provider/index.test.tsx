import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@/styles/index.css'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { http } from '@/lib/http'
import { SettingsAiProvider } from '.'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))
vi.mock('@/lib/http', () => ({
  http: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const status = (over: Record<string, unknown> = {}) => ({
  configured: false,
  source: null,
  hint: null,
  savedKeyUnreadable: false,
  ...over,
})

function settings(providers: Record<string, unknown>[]) {
  return {
    provider: 'OpenAI',
    providers,
    actions: [],
  }
}

async function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <SettingsAiProvider />
    </QueryClientProvider>
  )
}

describe('AI provider API keys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(http.put).mockResolvedValue({} as never)
    vi.mocked(http.delete).mockResolvedValue({} as never)
    vi.mocked(http.get).mockResolvedValue({
      data: settings([
        status({ name: 'OpenRouter' }),
        status({
          name: 'Anthropic',
          configured: true,
          source: 'config',
        }),
        status({
          name: 'OpenAI',
          configured: true,
          source: 'settings',
          hint: '1234',
        }),
      ]),
    } as never)
  })

  it('shows one key row per provider with where its key comes from', async () => {
    const screen = await renderPage()
    const row = (name: string) =>
      screen.getByRole('form', { name: `${name} API key` })

    await expect
      .element(row('OpenAI').getByText('Saved here, ends in 1234'))
      .toBeVisible()
    await expect
      .element(row('Anthropic').getByText('Set on the server'))
      .toBeVisible()
    await expect
      .element(row('OpenRouter').getByText('No key', { exact: true }))
      .toBeVisible()
  })

  it('saves the key of one provider only and clears the field', async () => {
    const screen = await renderPage()
    const row = screen.getByRole('form', { name: 'OpenRouter API key' })
    const field = row.getByPlaceholder('Paste the API key')
    await field.fill('  sk-or-new-key  ')

    await row.getByRole('button', { name: 'Save key' }).click()

    await vi.waitFor(() =>
      expect(http.put).toHaveBeenCalledWith(
        '/api/Settings/ai/keys/OpenRouter',
        { apiKey: 'sk-or-new-key' }
      )
    )
    expect(http.put).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalled())
    await expect.element(field).toHaveValue('')
  })

  it('does not offer to save an empty key', async () => {
    const screen = await renderPage()
    const row = screen.getByRole('form', { name: 'OpenRouter API key' })

    await expect
      .element(row.getByRole('button', { name: 'Save key' }))
      .toBeDisabled()
  })

  it('offers Remove only for a key saved here and removes just that one', async () => {
    const screen = await renderPage()
    const openAi = screen.getByRole('form', { name: 'OpenAI API key' })
    await expect
      .element(openAi.getByRole('button', { name: 'Remove' }))
      .toBeVisible()
    await expect
      .element(
        screen
          .getByRole('form', { name: 'Anthropic API key' })
          .getByRole('button', { name: 'Remove' })
      )
      .not.toBeInTheDocument()

    await openAi.getByRole('button', { name: 'Remove' }).click()

    await vi.waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith('/api/Settings/ai/keys/OpenAI')
    )
    expect(http.delete).toHaveBeenCalledTimes(1)
  })

  it('says so when a saved key can no longer be read', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: settings([status({ name: 'OpenAI', savedKeyUnreadable: true })]),
    } as never)
    const screen = await renderPage()

    await expect
      .element(screen.getByText(/can no longer be read/))
      .toBeVisible()
    await expect
      .element(
        screen
          .getByRole('form', { name: 'OpenAI API key' })
          .getByRole('button', { name: 'Remove' })
      )
      .toBeVisible()
  })

  it('shows the reason the server gave when a key is refused', async () => {
    vi.mocked(http.put).mockRejectedValue(
      Object.assign(new Error('bad'), {
        isAxiosError: true,
        response: {
          data: {
            errors: {
              ApiKey: ['The API key must not contain spaces or line breaks.'],
            },
          },
        },
      })
    )
    const screen = await renderPage()
    const row = screen.getByRole('form', { name: 'OpenRouter API key' })
    await row.getByPlaceholder('Paste the API key').fill('sk-x')
    await row.getByRole('button', { name: 'Save key' }).click()

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'The API key must not contain spaces or line breaks.'
      )
    )
  })
})
