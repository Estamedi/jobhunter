import { describe, expect, it } from 'vitest'
import {
  finishedEvent,
  listPollInterval,
  pollInterval,
  POLL_MS,
} from './draft-status'

describe('finishedEvent', () => {
  it('announces a draft that finished while it was being written', () => {
    expect(finishedEvent('Pending', 'Completed')).toBe('ready')
    expect(finishedEvent('Running', 'Completed')).toBe('ready')
  })

  it('announces a draft that failed while it was being written', () => {
    expect(finishedEvent('Running', 'Failed')).toBe('failed')
    expect(finishedEvent('Pending', 'Failed')).toBe('failed')
  })

  it('stays quiet while it is still being written', () => {
    expect(finishedEvent('Pending', 'Running')).toBeNull()
    expect(finishedEvent('Running', 'Running')).toBeNull()
  })

  it('stays quiet for a draft that was already finished or has no previous state', () => {
    expect(finishedEvent('Completed', 'Completed')).toBeNull()
    expect(finishedEvent('Failed', 'Failed')).toBeNull()
    expect(finishedEvent(undefined, 'Completed')).toBeNull()
  })
})

describe('pollInterval', () => {
  it('polls only while the draft is being written', () => {
    expect(pollInterval('Pending')).toBe(POLL_MS)
    expect(pollInterval('Running')).toBe(POLL_MS)
    expect(pollInterval('Completed')).toBe(false)
    expect(pollInterval('Failed')).toBe(false)
    expect(pollInterval(undefined)).toBe(false)
  })
})

describe('listPollInterval', () => {
  it('polls while any draft in the list is being written', () => {
    expect(
      listPollInterval([{ status: 'Completed' }, { status: 'Running' }])
    ).toBe(POLL_MS)
    expect(listPollInterval([{ status: 'Pending' }])).toBe(POLL_MS)
  })

  it('stops when every draft is finished or failed, or there are none', () => {
    expect(
      listPollInterval([{ status: 'Completed' }, { status: 'Failed' }, {}])
    ).toBe(false)
    expect(listPollInterval([])).toBe(false)
    expect(listPollInterval(undefined)).toBe(false)
  })
})
