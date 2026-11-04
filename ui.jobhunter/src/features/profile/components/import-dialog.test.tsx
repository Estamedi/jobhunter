import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@/styles/index.css'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { type ParsedProfile, type ProfileImportJob } from '../api'
import { ImportDialog } from './import-dialog'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))
vi.mock('@/features/cvs/api', () => ({
  cvsApi: {
    list: vi.fn(async () => ({
      items: [{ id: 3, fileName: 'cv.pdf' }],
      total: 1,
    })),
    upload: vi.fn(),
  },
}))
vi.mock('../api', () => ({
  profileApi: {
    latestImport: vi.fn(),
    startImport: vi.fn(),
    getImportJob: vi.fn(),
    importProfile: vi.fn(),
  },
}))

const { profileApi } = await import('../api')

const result = {
  headline: 'Senior engineer',
  summary: 'Twelve years of experience.',
  experiences: [
    {
      title: 'Lead',
      company: 'Acme',
      startDate: '2022-01-01',
      isCurrent: true,
      skills: [],
    },
  ],
  educations: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  links: [],
} as unknown as ParsedProfile

const job = (over: Partial<ProfileImportJob> = {}): ProfileImportJob => ({
  id: 7,
  cvId: 3,
  fileName: 'cv.pdf',
  status: 'Completed',
  result,
  created: '2026-11-04T00:00:00Z',
  ...over,
})

async function renderDialog() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ImportDialog
        candidateId={2}
        onOpenChange={vi.fn()}
        onImported={vi.fn()}
      />
    </QueryClientProvider>
  )
}

describe('ImportDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('offers the import that already finished and goes to its review', async () => {
    vi.mocked(profileApi.latestImport).mockResolvedValue(job())
    const screen = await renderDialog()

    await expect.element(screen.getByText(/We already read/)).toBeVisible()
    await screen.getByRole('button', { name: 'Continue' }).click()

    await expect
      .element(
        screen.getByText(
          'Check what was found. Uncheck anything you do not want to import.'
        )
      )
      .toBeVisible()
    await expect.element(screen.getByText('Lead')).toBeVisible()
    expect(profileApi.startImport).not.toHaveBeenCalled()
  })

  it('carries on with an import that is still being read, then shows the review', async () => {
    vi.mocked(profileApi.latestImport).mockResolvedValue(
      job({ status: 'Running', result: null })
    )
    vi.mocked(profileApi.getImportJob).mockResolvedValue(job())
    const screen = await renderDialog()

    await expect.element(screen.getByText('Analyzing your CV…')).toBeVisible()
    await expect
      .element(screen.getByText('Lead'), { timeout: 8000 })
      .toBeVisible()
    expect(profileApi.startImport).not.toHaveBeenCalled()
    expect(profileApi.getImportJob).toHaveBeenCalledWith(7)
  })

  it('has nothing to resume on a first visit and starts the reading for a chosen CV', async () => {
    vi.mocked(profileApi.latestImport).mockResolvedValue(null)
    vi.mocked(profileApi.startImport).mockResolvedValue(job())
    const screen = await renderDialog()

    await expect.element(screen.getByText('Upload a new CV')).toBeVisible()
    expect(screen.container.textContent).not.toContain('We already read')
    await screen.getByLabelText('cv.pdf').click()
    await screen.getByRole('button', { name: 'Analyze CV' }).click()

    await expect.element(screen.getByText('Lead')).toBeVisible()
    expect(profileApi.startImport).toHaveBeenCalledWith(3)
  })

  it('shows the reason when the CV could not be read', async () => {
    vi.mocked(profileApi.latestImport).mockResolvedValue(null)
    vi.mocked(profileApi.startImport).mockResolvedValue(
      job({
        status: 'Failed',
        result: null,
        error: 'No readable text was found in this file.',
      })
    )
    const screen = await renderDialog()
    await expect.element(screen.getByText('Upload a new CV')).toBeVisible()

    await screen.getByLabelText('cv.pdf').click()
    await screen.getByRole('button', { name: 'Analyze CV' }).click()

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'No readable text was found in this file.'
      )
    )
    await expect.element(screen.getByText('Upload a new CV')).toBeVisible()
  })

  it('does not offer a failed earlier try as something to continue', async () => {
    vi.mocked(profileApi.latestImport).mockResolvedValue(
      job({ status: 'Failed', result: null, error: 'x' })
    )
    const screen = await renderDialog()

    await expect.element(screen.getByText('Upload a new CV')).toBeVisible()
    expect(screen.container.textContent).not.toContain('We already read')
    expect(profileApi.getImportJob).not.toHaveBeenCalled()
  })
})
