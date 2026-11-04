import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@/styles/index.css'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import {
  type ParsedProfile,
  type ProfileImportJob,
} from '@/features/profile/api'
import { Onboarding } from '.'

const navigate = vi.fn()

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => navigate,
}))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))
vi.mock('@/features/auth/api', () => ({
  authApi: { updateOnboardingStatus: vi.fn() },
}))
vi.mock('@/features/candidates/api', () => ({
  candidatesApi: { mine: vi.fn(), update: vi.fn() },
}))
vi.mock('@/features/cvs/api', () => ({ cvsApi: { upload: vi.fn() } }))
vi.mock('@/features/profile/api', () => ({
  profileApi: {
    latestImport: vi.fn(),
    startImport: vi.fn(),
    getImportJob: vi.fn(),
    importProfile: vi.fn(),
  },
}))

const { authApi } = await import('@/features/auth/api')
const { candidatesApi } = await import('@/features/candidates/api')
const { profileApi } = await import('@/features/profile/api')

const me = {
  id: 2,
  fullName: 'Alex Example',
  email: 'alex@example.test',
  created: '2026-01-01T00:00:00Z',
}
const result = {
  headline: 'Senior engineer',
  summary: 'Twelve years.',
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
  fileName: 'My_Resume.pdf',
  status: 'Completed',
  result,
  created: '2026-11-04T00:00:00Z',
  ...over,
})

async function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <Onboarding />
    </QueryClientProvider>
  )
}

describe('Onboarding CV step when the user comes back', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(candidatesApi.mine).mockResolvedValue({
      items: [me],
      total: 1,
    } as never)
  })

  it('shows the upload step when there is nothing to resume', async () => {
    vi.mocked(profileApi.latestImport).mockResolvedValue(null)
    const screen = await renderPage()

    await expect.element(screen.getByText('Set up your profile')).toBeVisible()
    expect(profileApi.getImportJob).not.toHaveBeenCalled()
  })

  it('goes straight to the review when the CV was already read', async () => {
    vi.mocked(profileApi.latestImport).mockResolvedValue(job())
    const screen = await renderPage()

    await expect.element(screen.getByText('Review your profile')).toBeVisible()
    await expect.element(screen.getByText('My_Resume.pdf')).toBeVisible()
    expect(profileApi.startImport).not.toHaveBeenCalled()
  })

  it('carries on with a CV that is still being read', async () => {
    vi.mocked(profileApi.latestImport).mockResolvedValue(
      job({ status: 'Running', result: null })
    )
    vi.mocked(profileApi.getImportJob).mockResolvedValue(job())
    const screen = await renderPage()

    await expect.element(screen.getByText('Analyzing your CV…')).toBeVisible()
    await expect
      .element(screen.getByText('Review your profile'), { timeout: 8000 })
      .toBeVisible()
    expect(profileApi.getImportJob).toHaveBeenCalledWith(7)
  })

  it('does not resume a failed try', async () => {
    vi.mocked(profileApi.latestImport).mockResolvedValue(
      job({ status: 'Failed', result: null, error: 'x' })
    )
    const screen = await renderPage()

    await expect.element(screen.getByText('Set up your profile')).toBeVisible()
    expect(profileApi.getImportJob).not.toHaveBeenCalled()
  })
})

describe('Onboarding ends after the CV step', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(candidatesApi.mine).mockResolvedValue({
      items: [me],
      total: 1,
    } as never)
    vi.mocked(candidatesApi.update).mockResolvedValue(undefined as never)
    vi.mocked(profileApi.importProfile).mockResolvedValue(undefined as never)
    vi.mocked(authApi.updateOnboardingStatus).mockResolvedValue(
      undefined as never
    )
  })

  it('completes onboarding after the profile is saved and goes to the extension, with no questions', async () => {
    vi.mocked(profileApi.latestImport).mockResolvedValue(job())
    const screen = await renderPage()
    await expect.element(screen.getByText('Review your profile')).toBeVisible()

    await screen.getByRole('button', { name: 'Confirm and continue' }).click()

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/onboarding/extension',
        replace: true,
      })
    )
    expect(profileApi.importProfile).toHaveBeenCalled()
    expect(authApi.updateOnboardingStatus).toHaveBeenCalledWith('Completed')
    expect(navigate).not.toHaveBeenCalledWith(
      expect.objectContaining({ to: '/onboarding/questions' })
    )
  })

  it('stays on the page and says so when onboarding cannot be completed', async () => {
    vi.mocked(profileApi.latestImport).mockResolvedValue(job())
    vi.mocked(authApi.updateOnboardingStatus).mockRejectedValue(new Error('x'))
    const screen = await renderPage()
    await expect.element(screen.getByText('Review your profile')).toBeVisible()

    await screen.getByRole('button', { name: 'Confirm and continue' }).click()

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(navigate).not.toHaveBeenCalled()
  })

  it('marks onboarding as skipped and still offers the extension', async () => {
    vi.mocked(profileApi.latestImport).mockResolvedValue(null)
    const screen = await renderPage()
    await expect.element(screen.getByText('Set up your profile')).toBeVisible()

    await screen.getByRole('button', { name: 'Skip for now' }).click()

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/onboarding/extension',
        replace: true,
      })
    )
    expect(authApi.updateOnboardingStatus).toHaveBeenCalledWith('Skipped')
  })
})
