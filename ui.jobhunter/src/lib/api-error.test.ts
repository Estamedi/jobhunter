import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { getApiErrorMessage } from './api-error'

function badRequest(data: unknown) {
  const error = new AxiosError('Request failed with status code 400')
  error.response = { status: 400, data } as AxiosError['response']
  return error
}

describe('getApiErrorMessage', () => {
  it('says which field is too long and by how much', () => {
    const error = badRequest({
      title: 'One or more validation errors occurred.',
      errors: {
        'Experiences[0].Description': [
          "The length of 'Description' must be 2000 characters or fewer. You entered 2554 characters.",
        ],
      },
    })

    expect(getApiErrorMessage(error, 'fallback')).toBe(
      'Experience 1 description is too long (2554 characters, the limit is 2000)'
    )
  })

  it('prefixes other messages with their field', () => {
    const error = badRequest({
      errors: { Mode: ['Mode must be Merge or Replace.'] },
    })

    expect(getApiErrorMessage(error, 'fallback')).toBe(
      'Mode: Mode must be Merge or Replace.'
    )
  })

  it('falls back to the detail, then the title, then the fallback', () => {
    expect(
      getApiErrorMessage(badRequest({ detail: 'D', title: 'T' }), 'f')
    ).toBe('D')
    expect(getApiErrorMessage(badRequest({ title: 'T' }), 'f')).toBe('T')
    expect(getApiErrorMessage(badRequest({}), 'f')).toBe('f')
    expect(getApiErrorMessage('x', 'f')).toBe('f')
  })
})
