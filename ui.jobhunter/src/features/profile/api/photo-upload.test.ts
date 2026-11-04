import type { InternalAxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it } from 'vitest'
import { http } from '@/lib/http'
import { profileApi } from './index'

// The upload has to leave the browser as a multipart form. With the shared client's JSON default left in
// place, axios turns the form into JSON and the server answers 415.
describe('profileApi.savePhoto', () => {
  const original = http.defaults.adapter

  afterEach(() => {
    http.defaults.adapter = original
  })

  it('sends the photo as a form, not as JSON', async () => {
    let sent: InternalAxiosRequestConfig | undefined
    http.defaults.adapter = async (config) => {
      sent = config
      return {
        data: null,
        status: 204,
        statusText: 'No Content',
        headers: {},
        config,
      }
    }

    await profileApi.savePhoto(
      7,
      new Blob(['jpeg bytes'], { type: 'image/jpeg' })
    )

    expect(sent?.method).toBe('put')
    expect(sent?.url).toBe('/api/CandidateProfiles/photo')
    expect(sent?.data).toBeInstanceOf(FormData)
    const form = sent?.data as FormData
    expect(form.get('candidateId')).toBe('7')
    expect((form.get('file') as File).name).toBe('photo.jpg')
    expect(String(sent?.headers.get('Content-Type') ?? '')).not.toContain(
      'application/json'
    )
  })
})
