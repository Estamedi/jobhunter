import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@/styles/index.css'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { CvBuilder } from '.'
import { type CvDraft, type CvDraftSummary } from './api'

const navigate = vi.fn()

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => navigate,
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string
    children: React.ReactNode
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))
vi.mock('./lib/use-cv-hub', () => ({ useCvGenerationHub: vi.fn() }))
vi.mock('@/features/candidates/api', () => ({
  candidatesApi: { mine: vi.fn() },
}))
vi.mock('@/features/applications/api', () => ({
  applicationsApi: { list: vi.fn(), get: vi.fn(), attachCv: vi.fn() },
}))
vi.mock('@/features/job-roles/api', () => ({ jobRolesApi: { get: vi.fn() } }))
vi.mock('@/features/cvs/api', () => ({
  cvsApi: { list: vi.fn(async () => ({ items: [], total: 0 })) },
}))
vi.mock('@/features/profile/api', () => ({
  profileApi: { get: vi.fn(), getPhoto: vi.fn() },
}))
vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  cvBuilderApi: {
    list: vi.fn(),
    get: vi.fn(),
    score: vi.fn(),
    generate: vi.fn(),
    exportPdf: vi.fn(),
  },
}))

const { candidatesApi } = await import('@/features/candidates/api')
const { applicationsApi } = await import('@/features/applications/api')
const { profileApi } = await import('@/features/profile/api')
const { cvBuilderApi } = await import('./api')

const me = {
  id: 2,
  fullName: 'Alex Example',
  email: 'alex@example.test',
  created: '2026-01-01T00:00:00Z',
}

const summary = (over: Partial<CvDraftSummary> = {}): CvDraftSummary => ({
  id: 5,
  candidateId: 2,
  title: 'Platform engineer CV',
  jobTitle: 'Platform engineer',
  templateId: 'classic',
  created: '2026-11-01T00:00:00Z',
  lastModified: '2026-11-02T00:00:00Z',
  status: 'Completed',
  ...over,
})

const fullDraft = (over: Partial<CvDraft> = {}): CvDraft => ({
  ...summary(),
  content: {
    headline: 'Platform engineer',
    summary: 'Builds internal platforms.',
    skills: [],
    projects: [],
    experience: [],
    education: [],
    certifications: [],
    languages: [],
    links: [],
  },
  ...over,
})

function page(props: Parameters<typeof CvBuilder>[0], client: QueryClient) {
  return (
    <QueryClientProvider client={client}>
      <CvBuilder {...props} />
    </QueryClientProvider>
  )
}

async function renderPage(props: Parameters<typeof CvBuilder>[0] = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(page(props, client))
  return Object.assign(screen, {
    show: (next: Parameters<typeof CvBuilder>[0]) =>
      screen.rerender(page(next, client)),
  })
}

// Opens the first draft from the list, the way a user does.
async function openDraft(screen: Awaited<ReturnType<typeof renderPage>>) {
  await screen.getByText('Platform engineer CV').click()
}

describe('CV builder page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(candidatesApi.mine).mockResolvedValue({
      items: [me],
      total: 1,
    } as never)
    vi.mocked(applicationsApi.list).mockResolvedValue({
      items: [],
      total: 0,
    } as never)
    vi.mocked(profileApi.get).mockResolvedValue({
      experiences: [],
      skills: [],
    } as never)
    vi.mocked(profileApi.getPhoto).mockRejectedValue(new Error('404'))
    vi.mocked(cvBuilderApi.list).mockResolvedValue({
      items: [summary()],
      total: 1,
    })
    vi.mocked(cvBuilderApi.get).mockResolvedValue(fullDraft())
    vi.mocked(cvBuilderApi.score).mockRejectedValue(new Error('no score'))
  })

  describe('with no draft open', () => {
    it('lists the drafts and keeps the form out of the page', async () => {
      const screen = await renderPage()

      await expect
        .element(screen.getByText('Platform engineer CV'))
        .toBeVisible()
      await expect
        .element(screen.getByRole('button', { name: 'New CV' }))
        .toBeVisible()
      expect(screen.container.textContent).not.toContain('Job title')
    })

    it('shows the form in a dialog only after New CV is pressed', async () => {
      const screen = await renderPage()

      await screen.getByRole('button', { name: 'New CV' }).click()

      await expect.element(screen.getByText('Job title *')).toBeVisible()
    })

    it('invites the first CV when there are no drafts', async () => {
      vi.mocked(cvBuilderApi.list).mockResolvedValue({ items: [], total: 0 })
      const screen = await renderPage()

      await expect
        .element(screen.getByRole('button', { name: 'Create your first CV' }))
        .toBeVisible()
    })

    it('opens the form already filled when it comes from an application', async () => {
      vi.mocked(applicationsApi.get).mockResolvedValue({
        id: 9,
        jobRoleTitle: 'Staff engineer',
        jobRoleDescription: 'Lead the platform team.',
      } as never)
      const screen = await renderPage({ applicationId: 9 })

      await expect.element(screen.getByText('Job title *')).toBeVisible()
      await expect
        .element(screen.getByPlaceholder('e.g. Senior AI Engineer'))
        .toHaveValue('Staff engineer')
    })

    it('drops the job from the address when the dialog is closed by hand', async () => {
      vi.mocked(applicationsApi.get).mockResolvedValue({
        id: 9,
        jobRoleTitle: 'Staff engineer',
      } as never)
      const screen = await renderPage({ applicationId: 9 })
      await expect.element(screen.getByText('Job title *')).toBeVisible()

      await screen.getByRole('button', { name: 'Close' }).click()

      expect(navigate).toHaveBeenCalledWith({ to: '/cv-builder', search: {} })
    })

    it('opens the dialog again for another job, and for the same job after it was dropped', async () => {
      vi.mocked(applicationsApi.get).mockResolvedValue({
        id: 9,
        jobRoleTitle: 'Staff engineer',
      } as never)
      const screen = await renderPage({ applicationId: 9 })
      await expect.element(screen.getByText('Job title *')).toBeVisible()
      await screen.getByRole('button', { name: 'Close' }).click()
      await expect
        .element(screen.getByText('Job title *'))
        .not.toBeInTheDocument()
      await screen.show({}) // the address no longer carries the job

      await screen.show({ applicationId: 9 }) // "Write CV" for the same job again

      await expect.element(screen.getByText('Job title *')).toBeVisible()
    })
  })

  describe('with a draft open', () => {
    it('shows the workspace: a way back, the actions and the CV, not the list', async () => {
      const screen = await renderPage()
      await openDraft(screen)

      await expect
        .element(screen.getByRole('button', { name: 'All drafts' }))
        .toBeVisible()
      await expect
        .element(screen.getByRole('button', { name: 'Export' }))
        .toBeVisible()
      await expect
        .element(screen.getByText('Builds internal platforms.'))
        .toBeVisible()
      expect(screen.container.textContent).not.toContain('Your drafts')
      expect(screen.container.textContent).not.toContain('Your wishlist')
      expect(screen.container.textContent).not.toContain('Job title')
    })

    it('goes back to the list from the workspace', async () => {
      const screen = await renderPage()
      await openDraft(screen)

      await screen.getByRole('button', { name: 'All drafts' }).click()

      await expect.element(screen.getByText('Your drafts')).toBeVisible()
      await expect
        .element(screen.getByRole('button', { name: 'New CV' }))
        .toBeVisible()
    })

    it('keeps the same two places while the CV is still being written', async () => {
      vi.mocked(cvBuilderApi.list).mockResolvedValue({
        items: [summary({ status: 'Running' })],
        total: 1,
      })
      vi.mocked(cvBuilderApi.get).mockResolvedValue(
        fullDraft({ status: 'Running' })
      )
      const screen = await renderPage()
      await openDraft(screen)

      await expect.element(screen.getByText('Writing your CV…')).toBeVisible()
      await expect
        .element(screen.getByText(/appear here when your CV is ready/))
        .toBeVisible()
      expect(screen.container.textContent).not.toContain('Export')
    })

    it('says so when the draft cannot be opened', async () => {
      vi.mocked(cvBuilderApi.get).mockRejectedValue(new Error('404'))
      const screen = await renderPage()
      await openDraft(screen)

      await expect
        .element(screen.getByText(/could not be opened/))
        .toBeVisible()
    })

    it('asks before deleting from the more menu, and the page still works after cancel', async () => {
      const screen = await renderPage()
      await openDraft(screen)

      await screen.getByRole('button', { name: 'More actions' }).click()
      await screen.getByRole('menuitem', { name: 'Delete draft' }).click()
      await expect
        .element(screen.getByText(/Are you sure you want to delete/))
        .toBeVisible()
      await screen.getByRole('button', { name: 'Cancel' }).click()

      await screen.getByRole('button', { name: 'Export' }).click()
      await expect
        .element(screen.getByRole('menuitem', { name: 'PDF (A4)' }))
        .toBeVisible()
    })

    it('exports from the Export menu', async () => {
      vi.mocked(cvBuilderApi.exportPdf).mockRejectedValue(new Error('stop'))
      const screen = await renderPage()
      await openDraft(screen)

      await screen.getByRole('button', { name: 'Export' }).click()
      await screen.getByRole('menuitem', { name: 'PDF (A4)' }).click()

      await vi.waitFor(() =>
        expect(cvBuilderApi.exportPdf).toHaveBeenCalledWith(5, 'pdf')
      )
    })
  })
})
