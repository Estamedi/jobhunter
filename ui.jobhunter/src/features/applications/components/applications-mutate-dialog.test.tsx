import { type ComponentProps } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { ApplicationsMutateDialog } from './applications-mutate-dialog'

vi.mock('@/features/companies/api', () => ({
  companiesApi: { list: vi.fn(), create: vi.fn() },
}))
vi.mock('@/features/job-roles/api', () => ({
  jobRolesApi: { list: vi.fn(), create: vi.fn() },
}))
vi.mock('@/features/job-titles/api', () => ({
  jobTitlesApi: { list: vi.fn(), create: vi.fn() },
}))
vi.mock('@/features/contacts/api', () => ({
  contactsApi: { list: vi.fn(), create: vi.fn() },
}))
vi.mock('@/features/cvs/api', () => ({
  cvsApi: { list: vi.fn(), upload: vi.fn() },
}))
vi.mock('@/features/cvs/lib/cv-file', () => ({
  downloadCvFile: vi.fn(),
}))

const { companiesApi } = await import('@/features/companies/api')
const { jobRolesApi } = await import('@/features/job-roles/api')
const { jobTitlesApi } = await import('@/features/job-titles/api')
const { contactsApi } = await import('@/features/contacts/api')
const { cvsApi } = await import('@/features/cvs/api')

async function renderDialog(props: Partial<ComponentProps<typeof ApplicationsMutateDialog>> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onSubmit = vi.fn()
  const onOpenChange = vi.fn()
  const utils = await render(
    <QueryClientProvider client={queryClient}>
      <ApplicationsMutateDialog
        open
        onOpenChange={onOpenChange}
        isPending={false}
        candidateId={42}
        onSubmit={onSubmit}
        {...props}
      />
    </QueryClientProvider>
  )
  return { ...utils, onSubmit, onOpenChange }
}

describe('ApplicationsMutateDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(companiesApi.list).mockResolvedValue({ items: [{ id: 1, name: 'Acme Inc', priority: 'Medium' }], total: 1 })
    vi.mocked(jobRolesApi.list).mockResolvedValue({
      items: [{ id: 10, companyId: 1, title: 'Backend Engineer', source: 'LinkedIn', workType: 'Remote', employmentType: 'FullTime', roleStatus: 'Open' }],
      total: 1,
    })
    vi.mocked(jobTitlesApi.list).mockResolvedValue({ items: [], total: 0 })
    vi.mocked(contactsApi.list).mockResolvedValue({ items: [], total: 0 })
    vi.mocked(cvsApi.list).mockResolvedValue({
      items: [{ id: 5, candidateId: 42, fileName: 'resume-v1.pdf', contentType: 'application/pdf', fileSizeBytes: 1024, uploadedDate: '2026-01-01' }],
      total: 1,
    })
  })

  it('disables job role and contact until a company is selected', async () => {
    const { getByRole } = await renderDialog()

    const triggers = getByRole('button', { name: /select a company first/i })
    await expect.element(triggers.first()).toBeDisabled()
    expect(triggers.all()).toHaveLength(2)
  })

  it('selects an existing company and enables job role', async () => {
    const { getByRole, getByPlaceholder } = await renderDialog()

    await userEvent.click(getByRole('button', { name: /select company/i }))
    await userEvent.fill(getByPlaceholder(/search companies/i), 'Acme')
    await userEvent.click(getByRole('option', { name: /^Acme Inc$/i }))

    await expect.element(getByRole('button', { name: /^Acme Inc$/i })).toBeInTheDocument()
    await expect.element(getByRole('button', { name: /select vacancy/i })).not.toBeDisabled()
  })

  it('creates a new company inline and selects it', async () => {
    vi.mocked(companiesApi.create).mockResolvedValue(99)
    const { getByRole, getByPlaceholder } = await renderDialog()

    await userEvent.click(getByRole('button', { name: /select company/i }))
    await userEvent.fill(getByPlaceholder(/search companies/i), 'NewCo')

    const createOption = getByRole('option', { name: /create company "NewCo"/i })
    await expect.element(createOption).toBeInTheDocument()
    await userEvent.click(createOption)

    expect(companiesApi.create).toHaveBeenCalledWith({ name: 'NewCo' })
    await expect.element(getByRole('button', { name: /^NewCo$/i })).toBeInTheDocument()
  })

  it('does not show candidate id field and blocks submit without company/job role', async () => {
    const { getByRole, getByText, onSubmit } = await renderDialog()

    await expect.element(getByText(/candidate id/i)).not.toBeInTheDocument()

    await userEvent.click(getByRole('button', { name: /^create$/i }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits with candidateId injected and selected company/job role ids', async () => {
    const { getByRole, getByPlaceholder, onSubmit } = await renderDialog()

    await userEvent.click(getByRole('button', { name: /select company/i }))
    await userEvent.fill(getByPlaceholder(/search companies/i), 'Acme')
    await userEvent.click(getByRole('option', { name: /^Acme Inc$/i }))

    await userEvent.click(getByRole('button', { name: /select vacancy/i }))
    await userEvent.fill(getByPlaceholder(/search vacancies or job titles/i), 'Backend')
    await userEvent.click(getByRole('option', { name: /^Backend Engineer$/i }))

    await userEvent.click(getByRole('button', { name: /^create$/i }))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: 42,
        companyId: 1,
        jobRoleId: 10,
        mainContactId: undefined,
        cvId: undefined,
        appliedDate: undefined,
        nextFollowUpDate: undefined,
      })
    )
  })

  it('selects an existing resume and includes its id on submit', async () => {
    const { getByRole, getByPlaceholder, onSubmit } = await renderDialog()

    await userEvent.click(getByRole('button', { name: /select company/i }))
    await userEvent.fill(getByPlaceholder(/search companies/i), 'Acme')
    await userEvent.click(getByRole('option', { name: /^Acme Inc$/i }))

    await userEvent.click(getByRole('button', { name: /select vacancy/i }))
    await userEvent.fill(getByPlaceholder(/search vacancies or job titles/i), 'Backend')
    await userEvent.click(getByRole('option', { name: /^Backend Engineer$/i }))

    await userEvent.click(getByRole('button', { name: /select existing resume/i }))
    await userEvent.click(getByRole('option', { name: /^resume-v1\.pdf$/i }))
    await expect.element(getByRole('button', { name: /^resume-v1\.pdf$/i })).toBeInTheDocument()

    await userEvent.click(getByRole('button', { name: /^create$/i }))

    expect(cvsApi.upload).not.toHaveBeenCalled()
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ cvId: 5 }))
  })

  it('uploads a new resume file and includes the returned id on submit', async () => {
    vi.mocked(cvsApi.upload).mockResolvedValue(77)
    const { getByRole, getByPlaceholder, onSubmit } = await renderDialog()

    await userEvent.click(getByRole('button', { name: /select company/i }))
    await userEvent.fill(getByPlaceholder(/search companies/i), 'Acme')
    await userEvent.click(getByRole('option', { name: /^Acme Inc$/i }))

    await userEvent.click(getByRole('button', { name: /select vacancy/i }))
    await userEvent.fill(getByPlaceholder(/search vacancies or job titles/i), 'Backend')
    await userEvent.click(getByRole('option', { name: /^Backend Engineer$/i }))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['%PDF-1.4'], 'new-resume.pdf', { type: 'application/pdf' })
    await userEvent.upload(fileInput, file)

    await userEvent.click(getByRole('button', { name: /^create$/i }))

    expect(cvsApi.upload).toHaveBeenCalledWith({ candidateId: 42, file })
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ cvId: 77 }))
  })

  it('groups existing vacancies separately from job titles', async () => {
    vi.mocked(jobTitlesApi.list).mockResolvedValue({
      items: [{ id: 55, name: 'Product Manager', jobRoleCount: 1 }],
      total: 1,
    })
    const { getByRole, getByPlaceholder, getByText } = await renderDialog()

    await userEvent.click(getByRole('button', { name: /select company/i }))
    await userEvent.fill(getByPlaceholder(/search companies/i), 'Acme')
    await userEvent.click(getByRole('option', { name: /^Acme Inc$/i }))

    await userEvent.click(getByRole('button', { name: /select vacancy/i }))
    await userEvent.fill(getByPlaceholder(/search vacancies or job titles/i), 'e')

    await expect.element(getByText('Existing vacancies')).toBeInTheDocument()
    await expect.element(getByText('Job titles')).toBeInTheDocument()
    await expect.element(getByRole('option', { name: /^Backend Engineer$/i })).toBeInTheDocument()
    await expect.element(getByRole('option', { name: /^Product Manager$/i })).toBeInTheDocument()
  })

  it('creates a job role linked to the job title when none exists yet for this company', async () => {
    vi.mocked(jobTitlesApi.list).mockResolvedValue({
      items: [{ id: 55, name: 'Product Manager', jobRoleCount: 0 }],
      total: 1,
    })
    vi.mocked(jobRolesApi.list).mockImplementation((filters) =>
      Promise.resolve(
        filters?.jobTitleId
          ? { items: [], total: 0 }
          : {
              items: [
                { id: 10, companyId: 1, title: 'Backend Engineer', source: 'LinkedIn', workType: 'Remote', employmentType: 'FullTime', roleStatus: 'Open' },
              ],
              total: 1,
            }
      )
    )
    vi.mocked(jobRolesApi.create).mockResolvedValue(200)
    const { getByRole, getByPlaceholder, onSubmit } = await renderDialog()

    await userEvent.click(getByRole('button', { name: /select company/i }))
    await userEvent.fill(getByPlaceholder(/search companies/i), 'Acme')
    await userEvent.click(getByRole('option', { name: /^Acme Inc$/i }))

    await userEvent.click(getByRole('button', { name: /select vacancy/i }))
    await userEvent.fill(getByPlaceholder(/search vacancies or job titles/i), 'Product')
    await userEvent.click(getByRole('option', { name: /^Product Manager$/i }))

    await expect.element(getByRole('button', { name: /^Product Manager$/i })).toBeInTheDocument()
    expect(jobRolesApi.list).toHaveBeenCalledWith({ companyId: 1, jobTitleId: 55, pageSize: 1 })
    expect(jobRolesApi.create).toHaveBeenCalledWith({ companyId: 1, jobTitleId: 55, title: 'Product Manager' })

    await userEvent.click(getByRole('button', { name: /^create$/i }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ jobRoleId: 200 }))
  })

  it('reuses the existing job role when the selected job title already has one for this company', async () => {
    vi.mocked(jobTitlesApi.list).mockResolvedValue({
      items: [{ id: 55, name: 'Product Manager', jobRoleCount: 1 }],
      total: 1,
    })
    vi.mocked(jobRolesApi.list).mockImplementation((filters) =>
      Promise.resolve(
        filters?.jobTitleId === 55
          ? {
              items: [
                { id: 10, companyId: 1, jobTitleId: 55, title: 'Product Manager', source: 'LinkedIn', workType: 'Remote', employmentType: 'FullTime', roleStatus: 'Open' },
              ],
              total: 1,
            }
          : { items: [], total: 0 }
      )
    )
    const { getByRole, getByPlaceholder, onSubmit } = await renderDialog()

    await userEvent.click(getByRole('button', { name: /select company/i }))
    await userEvent.fill(getByPlaceholder(/search companies/i), 'Acme')
    await userEvent.click(getByRole('option', { name: /^Acme Inc$/i }))

    await userEvent.click(getByRole('button', { name: /select vacancy/i }))
    await userEvent.fill(getByPlaceholder(/search vacancies or job titles/i), 'Product')
    await userEvent.click(getByRole('option', { name: /^Product Manager$/i }))

    await expect.element(getByRole('button', { name: /^Product Manager$/i })).toBeInTheDocument()
    expect(jobRolesApi.create).not.toHaveBeenCalled()

    await userEvent.click(getByRole('button', { name: /^create$/i }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ jobRoleId: 10 }))
  })
})
