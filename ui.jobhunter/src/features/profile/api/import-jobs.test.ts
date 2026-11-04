import type { InternalAxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it } from 'vitest'
import { http } from '@/lib/http'
import { profileApi } from './index'

// The screens mock the API, so these run the real calls through the HTTP client and look at what is sent
// and how an empty answer is read.
describe('CV import API calls', () => {
  const original = http.defaults.adapter

  afterEach(() => {
    http.defaults.adapter = original
  })

  function answer(status: number, data: unknown) {
    const seen: InternalAxiosRequestConfig[] = []
    http.defaults.adapter = async (config) => {
      seen.push(config)
      return { data, status, statusText: '', headers: {}, config }
    }
    return seen
  }

  it('starts a reading with the CV id as JSON', async () => {
    const seen = answer(202, { id: 7, cvId: 3, status: 'Pending' })

    const job = await profileApi.startImport(3)

    expect(job.id).toBe(7)
    expect(seen[0].method).toBe('post')
    expect(seen[0].url).toBe('/api/CandidateProfiles/import-jobs')
    expect(JSON.parse(seen[0].data)).toEqual({ cvId: 3 })
    expect(String(seen[0].headers.get('Content-Type'))).toContain(
      'application/json'
    )
  })

  it('reads a job by its id', async () => {
    const seen = answer(200, { id: 7, status: 'Completed' })

    expect((await profileApi.getImportJob(7)).status).toBe('Completed')
    expect(seen[0].url).toBe('/api/CandidateProfiles/import-jobs/7')
  })

  it('reads "nothing to resume" (no content) as null and a job as the job', async () => {
    answer(204, '')
    expect(await profileApi.latestImport(2)).toBeNull()

    const seen = answer(200, {
      id: 7,
      cvId: 3,
      status: 'Completed',
      fileName: 'cv.pdf',
    })
    expect((await profileApi.latestImport(2))?.fileName).toBe('cv.pdf')
    expect(seen[0].url).toBe('/api/CandidateProfiles/import-jobs/latest')
    expect(seen[0].params).toEqual({ candidateId: 2 })
  })
})
