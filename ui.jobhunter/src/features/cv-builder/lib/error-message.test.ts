import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { serverDetail } from './error-message'

describe('serverDetail', () => {
  it('uses the detail the server sent', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { detail: 'The AI service is busy.' },
    } as AxiosError['response']

    expect(serverDetail(error, 'Failed')).toBe('The AI service is busy.')
  })

  it('falls back when there is no detail or the error is not an Axios error', () => {
    expect(serverDetail(new AxiosError('x'), 'Failed')).toBe('Failed')
    expect(serverDetail(new Error('x'), 'Failed')).toBe('Failed')
    expect(serverDetail(undefined, 'Failed')).toBe('Failed')
  })
})
