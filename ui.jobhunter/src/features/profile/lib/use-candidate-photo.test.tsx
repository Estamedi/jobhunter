import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { blobToDataUrl, useCandidatePhoto } from './use-candidate-photo'

vi.mock('../api', () => ({ profileApi: { getPhoto: vi.fn() } }))
const { profileApi } = await import('../api')

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useCandidatePhoto', () => {
  beforeEach(() => vi.clearAllMocks())

  it('turns the downloaded photo into a data URL that stays usable', async () => {
    vi.mocked(profileApi.getPhoto).mockResolvedValue(
      new Blob(['abc'], { type: 'image/jpeg' })
    )

    const { result } = await renderHook(() => useCandidatePhoto(5), { wrapper })

    await vi.waitFor(() => expect(result.current.url).not.toBeNull())
    expect(result.current.url).toMatch(/^data:image\/jpeg;base64,/)
    expect(profileApi.getPhoto).toHaveBeenCalledWith(5)
  })

  it('has no photo when the server says there is none', async () => {
    vi.mocked(profileApi.getPhoto).mockRejectedValue(new Error('404'))

    const { result } = await renderHook(() => useCandidatePhoto(5), { wrapper })

    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.url).toBeNull()
    expect(profileApi.getPhoto).toHaveBeenCalledTimes(1)
  })

  it('does not download anything when it is switched off or there is no candidate yet', async () => {
    await renderHook(() => useCandidatePhoto(5, false), { wrapper })
    await renderHook(() => useCandidatePhoto(undefined), { wrapper })

    await new Promise((r) => setTimeout(r, 50))
    expect(profileApi.getPhoto).not.toHaveBeenCalled()
  })
})

describe('blobToDataUrl', () => {
  it('reads a blob as a data URL', async () => {
    expect(await blobToDataUrl(new Blob(['hi'], { type: 'image/png' }))).toBe(
      'data:image/png;base64,aGk='
    )
  })
})
