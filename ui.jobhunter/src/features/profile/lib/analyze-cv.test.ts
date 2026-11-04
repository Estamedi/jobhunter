import { describe, expect, it, vi } from 'vitest'
import { type ParsedProfile, type ProfileImportJob } from '../api'
import {
  analyzeCv,
  ImportFailedError,
  isImportRunning,
  waitForImport,
} from './analyze-cv'

const profile = { headline: 'Engineer' } as ParsedProfile

const job = (over: Partial<ProfileImportJob> = {}): ProfileImportJob => ({
  id: 7,
  cvId: 3,
  fileName: 'cv.pdf',
  status: 'Pending',
  created: '2026-11-04T00:00:00Z',
  ...over,
})

const instant = () => Promise.resolve()

describe('waitForImport', () => {
  it('returns at once for a job that is already finished', async () => {
    const get = vi.fn()

    const result = await waitForImport(
      job({ status: 'Completed', result: profile }),
      { get, sleep: instant }
    )

    expect(result).toBe(profile)
    expect(get).not.toHaveBeenCalled()
  })

  it('keeps asking while the job is waiting or running, then returns the result', async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce(job({ status: 'Running' }))
      .mockResolvedValueOnce(job({ status: 'Running' }))
      .mockResolvedValueOnce(job({ status: 'Completed', result: profile }))
    const sleep = vi.fn(instant)

    const result = await waitForImport(job(), { get, sleep, intervalMs: 50 })

    expect(result).toBe(profile)
    expect(get).toHaveBeenCalledTimes(3)
    expect(get).toHaveBeenCalledWith(7)
    expect(sleep).toHaveBeenCalledWith(50)
  })

  it('throws the message of a failed job', async () => {
    const get = vi
      .fn()
      .mockResolvedValue(
        job({ status: 'Failed', error: 'No readable text was found.' })
      )

    await expect(
      waitForImport(job(), { get, sleep: instant })
    ).rejects.toThrowError(new ImportFailedError('No readable text was found.'))
  })

  it('uses a plain message when a failed job has none', async () => {
    await expect(
      waitForImport(job({ status: 'Failed' }), { sleep: instant })
    ).rejects.toThrow(/Could not read this CV/)
  })

  it('gives up after the time limit instead of waiting for ever', async () => {
    const get = vi.fn().mockResolvedValue(job({ status: 'Running' }))

    await expect(
      waitForImport(job(), {
        get,
        sleep: instant,
        intervalMs: 1000,
        timeoutMs: 3000,
      })
    ).rejects.toThrow(/taking longer than expected/)
    expect(get).toHaveBeenCalledTimes(3)
  })

  it('keeps going through a few failed polls and a good one resets the count', async () => {
    const get = vi
      .fn()
      .mockRejectedValueOnce(new Error('502'))
      .mockRejectedValueOnce(new Error('502'))
      .mockResolvedValueOnce(job({ status: 'Running' }))
      .mockRejectedValueOnce(new Error('502'))
      .mockRejectedValueOnce(new Error('502'))
      .mockResolvedValueOnce(job({ status: 'Completed', result: profile }))

    const result = await waitForImport(job(), { get, sleep: instant })

    expect(result).toBe(profile)
    expect(get).toHaveBeenCalledTimes(6)
  })

  it('says the connection was lost, not that the CV is bad, after too many failed polls in a row', async () => {
    const get = vi.fn().mockRejectedValue(new Error('network'))

    await expect(waitForImport(job(), { get, sleep: instant })).rejects.toThrow(
      /connection was lost, but your CV is still being read\. Come back in a moment/
    )
    expect(get).toHaveBeenCalledTimes(5)
  })

  it('words the time-limit message so it fits every screen', async () => {
    const get = vi.fn().mockResolvedValue(job({ status: 'Running' }))

    await expect(
      waitForImport(job(), {
        get,
        sleep: instant,
        intervalMs: 1000,
        timeoutMs: 1000,
      })
    ).rejects.toThrow(
      'Reading your CV is taking longer than expected. Come back in a moment to pick up the result.'
    )
  })
})

describe('analyzeCv', () => {
  it('starts the job for the CV and waits for it', async () => {
    const start = vi.fn().mockResolvedValue(job({ status: 'Pending' }))
    const get = vi
      .fn()
      .mockResolvedValue(job({ status: 'Completed', result: profile }))

    const result = await analyzeCv(3, { start, get, sleep: instant })

    expect(start).toHaveBeenCalledWith(3)
    expect(result).toBe(profile)
  })
})

describe('isImportRunning', () => {
  it('is true only while the job waits or runs', () => {
    expect(isImportRunning('Pending')).toBe(true)
    expect(isImportRunning('Running')).toBe(true)
    expect(isImportRunning('Completed')).toBe(false)
    expect(isImportRunning('Failed')).toBe(false)
  })
})
