import '@/styles/index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { ApplicationNotes } from './application-notes'

vi.mock('@/features/notes/api', () => ({
  notesApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))

const { notesApi } = await import('@/features/notes/api')

async function renderNotes() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ApplicationNotes applicationId={1} />
    </QueryClientProvider>
  )
}

describe('ApplicationNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the empty state when there are no notes yet', async () => {
    vi.mocked(notesApi.list).mockResolvedValue({ items: [], total: 0 })
    const { getByText } = await renderNotes()
    await expect.element(getByText(/no notes yet/i)).toBeInTheDocument()
  })

  it('adds a note via the composer', async () => {
    vi.mocked(notesApi.list).mockResolvedValue({ items: [], total: 0 })
    vi.mocked(notesApi.create).mockResolvedValue(1)
    const { getByPlaceholder, getByRole } = await renderNotes()

    await userEvent.fill(getByPlaceholder(/interview prep/i), 'Called the recruiter today.')
    await userEvent.click(getByRole('button', { name: /add note/i }))

    expect(notesApi.create).toHaveBeenCalledWith({ content: 'Called the recruiter today.', applicationId: 1 })
  })

  it('lists existing notes and supports editing one', async () => {
    vi.mocked(notesApi.list).mockResolvedValue({
      items: [
        { id: 5, applicationId: 1, content: 'First note', created: '2026-01-01T00:00:00Z', lastModified: '2026-01-01T00:00:00Z' },
      ],
      total: 1,
    })
    vi.mocked(notesApi.update).mockResolvedValue(undefined as never)
    const { getByText, getByRole } = await renderNotes()

    await expect.element(getByText('First note')).toBeInTheDocument()
    await userEvent.click(getByRole('button', { name: /edit note/i }))

    const editBox = getByRole('textbox').nth(1)
    await userEvent.fill(editBox, 'First note, updated')
    await userEvent.click(getByRole('button', { name: /save note/i }))

    expect(notesApi.update).toHaveBeenCalledWith(5, { content: 'First note, updated', applicationId: 1 })
  })

  it('deletes a note after confirming', async () => {
    vi.mocked(notesApi.list).mockResolvedValue({
      items: [
        { id: 7, applicationId: 1, content: 'Delete me', created: '2026-01-01T00:00:00Z', lastModified: '2026-01-01T00:00:00Z' },
      ],
      total: 1,
    })
    vi.mocked(notesApi.delete).mockResolvedValue(undefined as never)
    const { getByRole } = await renderNotes()

    await userEvent.click(getByRole('button', { name: /delete note/i }))
    await userEvent.click(getByRole('button', { name: /^delete$/i }))

    expect(notesApi.delete).toHaveBeenCalledWith(7)
  })
})
