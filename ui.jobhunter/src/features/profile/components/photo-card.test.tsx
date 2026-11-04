import '@/styles/index.css'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { PhotoCard } from './photo-card'

async function setup(props: Partial<Parameters<typeof PhotoCard>[0]> = {}) {
  const onPick = vi.fn()
  const onRemove = vi.fn()
  const screen = await render(
    <PhotoCard
      photoUrl={null}
      isLoading={false}
      isBusy={false}
      onPick={onPick}
      onRemove={onRemove}
      {...props}
    />
  )
  return { screen, onPick, onRemove }
}

describe('PhotoCard', () => {
  it('offers an upload and no remove button while there is no photo', async () => {
    const { screen } = await setup()

    await expect.element(screen.getByText('Upload photo')).toBeVisible()
    await expect.element(screen.getByText('No photo yet').first()).toBeVisible()
    expect(screen.container.textContent).not.toContain('Remove')
  })

  it('shows the photo with change and remove buttons, and removes it when asked', async () => {
    const { screen, onRemove } = await setup({
      photoUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
    })

    await expect.element(screen.getByText('Change photo')).toBeVisible()
    await screen.getByText('Remove').click()

    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('hands a chosen picture to the page and can be used again afterwards', async () => {
    const { screen, onPick } = await setup()
    const input = screen
      .getByTestId('photo-input')
      .element() as HTMLInputElement
    const file = new File(['x'], 'me.png', { type: 'image/png' })
    const transfer = new DataTransfer()
    transfer.items.add(file)

    input.files = transfer.files
    input.dispatchEvent(new Event('change', { bubbles: true }))

    expect(onPick).toHaveBeenCalledWith(file)
    expect(input.value).toBe('')
  })

  it('cannot be used while a photo is being saved', async () => {
    const { screen } = await setup({ isBusy: true })

    await expect.element(screen.getByText('Upload photo')).toBeDisabled()
  })
})
