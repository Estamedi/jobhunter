import { describe, expect, it } from 'vitest'
import { isPhotoFile, portraitCrop, PHOTO_HEIGHT, PHOTO_WIDTH } from './photo'

const ratio = PHOTO_WIDTH / PHOTO_HEIGHT

describe('portraitCrop', () => {
  it('takes a centred 3:4 strip from a landscape picture', () => {
    const crop = portraitCrop(4000, 3000)

    expect(crop.height).toBe(3000)
    expect(crop.width).toBe(2250)
    expect(crop.x).toBe(875)
    expect(crop.y).toBe(0)
  })

  it('takes a centred 3:4 slice from a tall picture', () => {
    const crop = portraitCrop(1000, 2000)

    expect(crop.width).toBe(1000)
    expect(crop.height).toBe(Math.round(1000 / ratio))
    expect(crop.y).toBe(Math.round((2000 - crop.height) / 2))
    expect(crop.x).toBe(0)
  })

  it('keeps a picture that is already 3:4', () => {
    expect(portraitCrop(600, 800)).toEqual({
      x: 0,
      y: 0,
      width: 600,
      height: 800,
    })
  })

  it('always stays inside the picture and keeps the 3:4 shape', () => {
    for (const [w, h] of [
      [100, 100],
      [5000, 100],
      [100, 5000],
      [3024, 4032],
      [4032, 3024],
    ]) {
      const c = portraitCrop(w, h)
      expect(c.x).toBeGreaterThanOrEqual(0)
      expect(c.y).toBeGreaterThanOrEqual(0)
      expect(c.x + c.width).toBeLessThanOrEqual(w)
      expect(c.y + c.height).toBeLessThanOrEqual(h)
      expect(Math.abs(c.width / c.height - ratio)).toBeLessThan(0.01)
    }
  })
})

describe('isPhotoFile', () => {
  it('accepts the image types a browser can read', () => {
    expect(isPhotoFile({ type: 'image/jpeg' })).toBe(true)
    expect(isPhotoFile({ type: 'image/png' })).toBe(true)
    expect(isPhotoFile({ type: 'image/webp' })).toBe(true)
  })

  it('refuses anything else', () => {
    expect(isPhotoFile({ type: 'application/pdf' })).toBe(false)
    expect(isPhotoFile({ type: 'image/gif' })).toBe(false)
    expect(isPhotoFile({ type: '' })).toBe(false)
  })
})
