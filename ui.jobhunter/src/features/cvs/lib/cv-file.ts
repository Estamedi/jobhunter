import { cvsApi } from '../api'

export async function downloadCvFile(cv: { id: number; fileName: string }) {
  const blob = await cvsApi.download(cv.id)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = cv.fileName
  link.click()
  URL.revokeObjectURL(url)
}

export async function viewCvFile(cv: { id: number }) {
  const blob = await cvsApi.download(cv.id)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
