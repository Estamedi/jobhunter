// The CV photo is cropped to a 3:4 portrait and scaled down in the browser before it is uploaded. The
// server then only receives a small JPEG, and a phone photo that is stored sideways is turned the right
// way up when the browser draws it.
export const PHOTO_WIDTH = 600
export const PHOTO_HEIGHT = 800
const PHOTO_QUALITY = 0.85
export const MAX_PHOTO_INPUT_BYTES = 15 * 1024 * 1024

interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

// The largest 3:4 portrait that fits in the picture, taken from the middle.
export function portraitCrop(width: number, height: number): CropRect {
  const target = PHOTO_WIDTH / PHOTO_HEIGHT
  if (width / height > target) {
    const cropWidth = Math.round(height * target)
    return {
      x: Math.round((width - cropWidth) / 2),
      y: 0,
      width: cropWidth,
      height,
    }
  }
  const cropHeight = Math.round(width / target)
  return {
    x: 0,
    y: Math.round((height - cropHeight) / 2),
    width,
    height: cropHeight,
  }
}

export function isPhotoFile(file: { type: string }): boolean {
  return (
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    file.type === 'image/webp'
  )
}

export async function preparePhoto(file: File): Promise<Blob> {
  // 'from-image' applies the EXIF rotation, so the photo is upright.
  const bitmap = await createImageBitmap(file, {
    imageOrientation: 'from-image',
  })
  try {
    const crop = portraitCrop(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = PHOTO_WIDTH
    canvas.height = PHOTO_HEIGHT
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not prepare the photo')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, PHOTO_WIDTH, PHOTO_HEIGHT)
    context.drawImage(
      bitmap,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      PHOTO_WIDTH,
      PHOTO_HEIGHT
    )

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error('Could not prepare the photo')),
        'image/jpeg',
        PHOTO_QUALITY
      )
    )
  } finally {
    bitmap.close()
  }
}
