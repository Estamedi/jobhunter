import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@/styles/index.css'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { Profile } from '.'
import { CANDIDATE, PROFILE } from './profile-test-data'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
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
  }
})

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('@/features/candidates/api', () => ({
  candidatesApi: { mine: vi.fn() },
}))

vi.mock('./api', () => ({
  profileApi: {
    get: vi.fn(),
    updateAbout: vi.fn(),
    updateContact: vi.fn(),
    getPhoto: vi.fn(),
    savePhoto: vi.fn(),
    deletePhoto: vi.fn(),
    addSkill: vi.fn(),
    updateSkill: vi.fn(),
    deleteSkill: vi.fn(),
  },
}))

vi.mock('@/features/cvs/api', () => ({
  cvsApi: {
    list: vi.fn(async () => ({ items: [], total: 0 })),
    upload: vi.fn(),
  },
}))

vi.mock('./lib/photo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/photo')>()),
  preparePhoto: vi.fn(async () => new Blob(['jpeg'], { type: 'image/jpeg' })),
}))

const { profileApi } = await import('./api')
const { candidatesApi } = await import('@/features/candidates/api')

async function renderPage(
  options: { photo?: boolean; profile?: unknown; candidate?: unknown } = {}
) {
  vi.mocked(candidatesApi.mine).mockResolvedValue({
    items: [options.candidate ?? CANDIDATE],
    total: 1,
  } as never)
  vi.mocked(profileApi.get).mockResolvedValue(
    (options.profile ?? PROFILE) as never
  )
  if (options.photo) {
    vi.mocked(profileApi.getPhoto).mockResolvedValue(
      new Blob(['x'], { type: 'image/jpeg' })
    )
  } else {
    vi.mocked(profileApi.getPhoto).mockRejectedValue(new Error('404'))
  }
  vi.mocked(profileApi.updateAbout).mockResolvedValue(1 as never)
  vi.mocked(profileApi.updateContact).mockResolvedValue({} as never)
  vi.mocked(profileApi.savePhoto).mockResolvedValue({} as never)
  vi.mocked(profileApi.deletePhoto).mockResolvedValue({} as never)

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <Profile />
    </QueryClientProvider>
  )
}

describe('Profile page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the intro like LinkedIn: name, headline, place, current company and school', async () => {
    const screen = await renderPage()

    await expect
      .element(screen.getByRole('heading', { name: 'Alex Example' }))
      .toBeVisible()
    await expect
      .element(screen.getByText('Software engineer | 13+ years experience'))
      .toBeVisible()
    await expect
      .element(screen.getByText(/Testville, Oman · Available: Immediately/))
      .toBeVisible()
    await expect.element(screen.getByText('Contact info')).toBeVisible()
    // The current company and the latest school sit beside the name.
    await expect
      .element(
        screen.getByText('Example Institute of Higher Education').first()
      )
      .toBeVisible()
    expect(screen.container.textContent).toContain('Acme Consultancy')
  })

  it('groups roles at one company and cuts a long About with a see more toggle', async () => {
    const screen = await renderPage()

    await expect.element(screen.getByText('Technical Lead')).toBeVisible()
    await expect
      .element(screen.getByText('Full Stack Developer').first())
      .toBeVisible()
    // The two Acme roles share one company heading; Globex has its own.
    expect(
      screen.container.textContent?.match(/Acme Consultancy/g)?.length
    ).toBeGreaterThanOrEqual(1)
    await expect.element(screen.getByText('Globex Software')).toBeVisible()

    const more = screen.getByText('…see more').first()
    await more.click()
    await expect.element(screen.getByText('see less').first()).toBeVisible()
  })

  it('keeps the headline when only the About text is edited', async () => {
    const screen = await renderPage()

    await screen.getByRole('button', { name: 'Edit about' }).click()
    await screen
      .getByRole('dialog')
      .getByRole('textbox')
      .fill('A new, shorter summary.')
    await screen.getByRole('button', { name: 'Save' }).click()

    await vi.waitFor(() => expect(profileApi.updateAbout).toHaveBeenCalled())
    expect(profileApi.updateAbout).toHaveBeenCalledWith({
      candidateId: 2,
      headline: 'Software engineer | 13+ years experience',
      summary: 'A new, shorter summary.',
    })
    expect(profileApi.updateContact).not.toHaveBeenCalled()
  })

  it('keeps the About text, and the availability, when the name and headline are edited', async () => {
    const screen = await renderPage()

    await screen.getByRole('button', { name: 'Edit intro' }).click()
    await screen.getByLabelText('Full name*').fill('Alexander Example')
    await screen.getByLabelText('Headline').fill('Principal engineer')
    await screen.getByRole('button', { name: 'Save' }).click()

    await vi.waitFor(() => expect(profileApi.updateAbout).toHaveBeenCalled())
    expect(profileApi.updateAbout).toHaveBeenCalledWith({
      candidateId: 2,
      headline: 'Principal engineer',
      summary: PROFILE.summary,
    })
    // A new name goes through the contact call, which must carry the other contact details as they are.
    expect(profileApi.updateContact).toHaveBeenCalledWith({
      candidateId: 2,
      fullName: 'Alexander Example',
      email: 'alex@example.test',
      phone: '+000 0000 0000',
      currentLocation: 'Testville, Oman',
      availability: 'Immediately',
    })
  })

  it('opens the contact dialog from "Contact info" and saves the availability', async () => {
    const screen = await renderPage()

    await screen.getByText('Contact info').click()
    await expect
      .element(screen.getByLabelText('Availability'))
      .toHaveValue('Immediately')
    await screen.getByLabelText('Availability').fill('1 month notice')
    await screen.getByRole('button', { name: 'Save' }).click()

    await vi.waitFor(() => expect(profileApi.updateContact).toHaveBeenCalled())
    expect(profileApi.updateContact).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: 2,
        availability: '1 month notice',
        email: 'alex@example.test',
      })
    )
  })

  it('lists what is missing in the checklist, with a photo among it when there is none', async () => {
    const screen = await renderPage({
      profile: { ...PROFILE, headline: '', skills: [] },
    })

    await expect
      .element(screen.getByText('You have not added a photo yet.'))
      .toBeVisible()
    await expect
      .element(screen.getByText('Your headline is empty.'))
      .toBeVisible()
    await expect
      .element(screen.getByText('Your profile has no skills yet.'))
      .toBeVisible()
    await expect
      .element(screen.getByRole('progressbar', { name: 'Profile strength' }))
      .toHaveAttribute('aria-valuenow', '67')
  })

  it('says the profile is complete when nothing is missing', async () => {
    const screen = await renderPage({ photo: true })

    await expect
      .element(screen.getByText('Your profile is complete.'))
      .toBeVisible()
    await expect
      .element(screen.getByRole('progressbar', { name: 'Profile strength' }))
      .toHaveAttribute('aria-valuenow', '100')
  })

  it("offers every section in the Add section menu and opens that section's dialog", async () => {
    const screen = await renderPage()

    await screen.getByRole('button', { name: 'Add section' }).click()
    for (const label of [
      'Experience',
      'Education',
      'Skills',
      'Projects',
      'Certifications',
      'Languages',
      'Links',
    ]) {
      await expect
        .element(screen.getByRole('menuitem', { name: label }))
        .toBeVisible()
    }
    await screen.getByRole('menuitem', { name: 'Projects' }).click()

    await expect
      .element(screen.getByRole('dialog').getByText('Add project'))
      .toBeVisible()
  })

  it('opens the skill dialog from the Add section menu', async () => {
    const screen = await renderPage()

    await screen.getByRole('button', { name: 'Add section' }).click()
    await screen.getByRole('menuitem', { name: 'Skills' }).click()

    await expect
      .element(screen.getByRole('dialog').getByText('Add skill').first())
      .toBeVisible()
  })

  it('offers an upload when there is no photo and sends the picked picture', async () => {
    const screen = await renderPage()

    await screen.getByRole('button', { name: 'Change profile photo' }).click()
    await expect
      .element(screen.getByRole('menuitem', { name: 'Upload photo' }))
      .toBeVisible()
    expect(screen.container.textContent).not.toContain('Remove photo')

    const input = screen
      .getByTestId('photo-input')
      .element() as HTMLInputElement
    const transfer = new DataTransfer()
    transfer.items.add(new File(['x'], 'me.png', { type: 'image/png' }))
    input.files = transfer.files
    input.dispatchEvent(new Event('change', { bubbles: true }))

    await vi.waitFor(() => expect(profileApi.savePhoto).toHaveBeenCalled())
    expect(vi.mocked(profileApi.savePhoto).mock.calls[0][0]).toBe(2)
    expect(input.value).toBe('')
  })

  it('refuses a file that is not a picture before it is sent', async () => {
    const screen = await renderPage()
    await expect
      .element(screen.getByRole('heading', { name: 'Alex Example' }))
      .toBeVisible()

    const input = screen
      .getByTestId('photo-input')
      .element() as HTMLInputElement
    const transfer = new DataTransfer()
    transfer.items.add(new File(['x'], 'cv.pdf', { type: 'application/pdf' }))
    input.files = transfer.files
    input.dispatchEvent(new Event('change', { bubbles: true }))

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(profileApi.savePhoto).not.toHaveBeenCalled()
  })

  it('shows the photo, and removes it from the photo menu', async () => {
    const screen = await renderPage({ photo: true })

    await expect
      .element(screen.getByAltText('Your profile photo'))
      .toBeVisible()
    await screen.getByRole('button', { name: 'Change profile photo' }).click()
    await expect
      .element(screen.getByRole('menuitem', { name: 'Change photo' }))
      .toBeVisible()
    await screen.getByRole('menuitem', { name: 'Remove photo' }).click()

    await vi.waitFor(() =>
      expect(profileApi.deletePhoto).toHaveBeenCalledWith(2)
    )
  })

  it('shows the initials in the round photo when there is no picture', async () => {
    const screen = await renderPage()

    await expect
      .element(screen.getByRole('button', { name: 'Change profile photo' }))
      .toHaveTextContent('AE')
  })

  it('opens the file picker from the avatar menu', async () => {
    const screen = await renderPage()
    await expect
      .element(screen.getByRole('heading', { name: 'Alex Example' }))
      .toBeVisible()
    const click = vi.spyOn(HTMLInputElement.prototype, 'click')

    await screen.getByRole('button', { name: 'Change profile photo' }).click()
    await screen.getByRole('menuitem', { name: 'Upload photo' }).click()

    expect(click).toHaveBeenCalled()
    click.mockRestore()
  })

  it('opens the file picker from the checklist when the photo is missing', async () => {
    const screen = await renderPage()
    await expect
      .element(screen.getByText('You have not added a photo yet.'))
      .toBeVisible()
    const click = vi.spyOn(HTMLInputElement.prototype, 'click')

    await screen
      .getByText('You have not added a photo yet.')
      .element()
      .parentElement!.querySelector('button')!
      .click()

    expect(click).toHaveBeenCalled()
    click.mockRestore()
  })

  it('tells where the photo is used and that the AI never gets it', async () => {
    const screen = await renderPage()

    await screen.getByRole('button', { name: 'Change profile photo' }).click()

    await expect.element(screen.getByText(/never sent to the AI/)).toBeVisible()
  })

  it('opens the CV import from the header', async () => {
    const screen = await renderPage()

    await screen.getByRole('button', { name: 'Import from CV' }).click()

    await expect
      .element(screen.getByRole('dialog').getByText('Import from CV').first())
      .toBeVisible()
  })
})
