import { useQuery } from '@tanstack/react-query'
import { profileApi } from '../api'

// A photo as a data URL, which an <img> can use at any time. An object URL would need releasing, and React
// StrictMode runs that cleanup right after the first render in development, which would break the image.
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () =>
      reject(reader.error ?? new Error('Could not read the photo'))
    reader.readAsDataURL(blob)
  })
}

// The candidate's CV photo for an <img>, or null when there is none. The photo needs the bearer token, so it
// is fetched with the API client and not loaded by the browser from a plain URL. A missing photo is a normal
// 404 answer, so it is not retried. Pass enabled=false to skip the download when no photo is needed.
export function useCandidatePhoto(candidateId?: number, enabled = true) {
  const query = useQuery({
    queryKey: ['candidate-photo', candidateId],
    queryFn: async () => blobToDataUrl(await profileApi.getPhoto(candidateId!)),
    enabled: !!candidateId && enabled,
    retry: false,
    staleTime: 60_000,
  })

  return { url: query.data ?? null, isLoading: query.isLoading }
}
