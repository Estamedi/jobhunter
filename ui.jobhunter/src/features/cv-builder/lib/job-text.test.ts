import { describe, expect, it } from 'vitest'
import { jobPostingText } from './job-text'

describe('jobPostingText', () => {
  it('joins the description and the requirements', () => {
    expect(jobPostingText('Build APIs.', '- C#\n- SQL')).toBe(
      'Build APIs.\n\nRequirements:\n- C#\n- SQL'
    )
  })

  it('works with only one of them and trims whitespace', () => {
    expect(jobPostingText('  Build APIs.  ', null)).toBe('Build APIs.')
    expect(jobPostingText(undefined, ' - C# ')).toBe('Requirements:\n- C#')
  })

  it('returns an empty string when there is no posting text', () => {
    expect(jobPostingText('', '  ')).toBe('')
    expect(jobPostingText(null, undefined)).toBe('')
  })
})
