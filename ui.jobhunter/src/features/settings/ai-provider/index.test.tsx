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
    actions: [
      {
        action: 'CvGeneration',
        label: 'CV generation',
        description: 'Writes and refines tailored CVs.',
        provider: null as string | null,
        model: null as string | null,
        defaultModels: { OpenAI: 'gpt-5.5', Anthropic: 'claude-opus-4-8' },
      },
    ],
  }
}

// Answers the settings request and the model-list request by their address.
function serve(
  data: ReturnType<typeof settings>,
  models: { models: string[]; problem: string | null } = {
    models: ['gpt-4o', 'gpt-4o-mini', 'o3'],
    problem: null,
  }
) {
  vi.mocked(http.get).mockImplementation(
    (url: string) =>
      Promise.resolve({
        data: url.startsWith('/api/Settings/ai/models/') ? models : data,
      }) as never
  )
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
    serve(
      settings([
        status({ name: 'OpenRouter' }),
        status({ name: 'Anthropic', configured: true, source: 'config' }),
        status({
          name: 'OpenAI',
          configured: true,
          source: 'settings',
          hint: '1234',
        }),
      ])
    )
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
    serve(settings([status({ name: 'OpenAI', savedKeyUnreadable: true })]))
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

describe('Model field of an AI action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(http.put).mockResolvedValue({} as never)
  })

  async function withProviderChosen(
    models?: { models: string[]; problem: string | null },
    saved?: { provider: string; model: string }
  ) {
    const data = settings([
      status({ name: 'OpenAI', configured: true, source: 'config' }),
    ])
    if (saved) data.actions[0] = { ...data.actions[0], ...saved }
    serve(data, models)
    return renderPage()
  }

  const field = (screen: Awaited<ReturnType<typeof renderPage>>) =>
    screen.getByRole('combobox', { name: 'CV generation model' })

  it('is disabled while the action uses the default provider', async () => {
    const screen = await withProviderChosen()

    await expect.element(field(screen)).toBeDisabled()
  })

  it('shows the saved model even when it is not in the provider list', async () => {
    const screen = await withProviderChosen(undefined, {
      provider: 'OpenAI',
      model: 'claude-opus-4-8',
    })

    await expect.element(field(screen)).toHaveTextContent('claude-opus-4-8')
  })

  it('filters the list as you type and picks the model that was clicked', async () => {
    const screen = await withProviderChosen(undefined, {
      provider: 'OpenAI',
      model: '',
    })
    await field(screen).click()
    await expect
      .element(screen.getByRole('option', { name: 'o3' }))
      .toBeVisible()

    await screen.getByPlaceholder('Search or type a model name').fill('mini')
    await expect
      .element(screen.getByRole('option', { name: 'gpt-4o-mini' }))
      .toBeVisible()
    await expect
      .element(screen.getByRole('option', { name: 'o3' }))
      .not.toBeInTheDocument()
    await screen.getByRole('option', { name: 'gpt-4o-mini' }).click()

    await expect.element(field(screen)).toHaveTextContent('gpt-4o-mini')
    await screen.getByRole('button', { name: 'Save actions' }).click()
    await vi.waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/api/Settings/ai/actions', {
        actions: [
          { action: 'CvGeneration', provider: 'OpenAI', model: 'gpt-4o-mini' },
        ],
      })
    )
  })

  it('lets a name that is not in the list be used as typed', async () => {
    const screen = await withProviderChosen(undefined, {
      provider: 'OpenAI',
      model: '',
    })
    await field(screen).click()

    await screen
      .getByPlaceholder('Search or type a model name')
      .fill('gpt-9-preview')
    await screen.getByRole('option', { name: /Use “gpt-9-preview”/ }).click()

    await expect.element(field(screen)).toHaveTextContent('gpt-9-preview')
  })

  it('clears the model back to the default', async () => {
    const screen = await withProviderChosen(undefined, {
      provider: 'OpenAI',
      model: 'o3',
    })
    await field(screen).click()

    await screen.getByRole('option', { name: /Use the default model/ }).click()

    await expect.element(field(screen)).toHaveTextContent('gpt-5.5')
  })

  it('says why the models are only suggestions and still lets you type', async () => {
    const screen = await withProviderChosen(
      {
        models: ['gpt-5.5'],
        problem: 'No API key for this provider, so these are suggested models.',
      },
      { provider: 'OpenAI', model: '' }
    )
    await field(screen).click()

    await expect
      .element(screen.getByText(/No API key for this provider/))
      .toBeVisible()
    await screen
      .getByPlaceholder('Search or type a model name')
      .fill('my-model')
    await expect
      .element(screen.getByRole('option', { name: /Use “my-model”/ }))
      .toBeVisible()
  })
})
