import { describe, expect, it } from 'vitest'
import {
  headerLinkLabel,
  headerLinkText,
  headerLinkUrl,
  pickHeaderLink,
} from './header-link'

describe('pickHeaderLink', () => {
  it('prefers a LinkedIn link, then the first link', () => {
    expect(
      pickHeaderLink(['https://github.com/a', 'https://www.linkedin.com/in/a/'])
    ).toBe('https://www.linkedin.com/in/a/')
    expect(pickHeaderLink(['github.com/a', 'example.com'])).toBe('github.com/a')
    expect(pickHeaderLink(['', ' ', 'example.com'])).toBe('example.com')
  })

  it('has no link when there are none', () => {
    expect(pickHeaderLink([])).toBeNull()
    expect(pickHeaderLink(['  '])).toBeNull()
  })
})

describe('header link text', () => {
  it('shows the link without protocol or trailing slash and labels LinkedIn', () => {
    expect(headerLinkText('https://www.linkedin.com/in/a/')).toBe(
      'www.linkedin.com/in/a'
    )
    expect(headerLinkText('github.com/a')).toBe('github.com/a')
    expect(headerLinkLabel('https://www.linkedin.com/in/a/')).toBe('LinkedIn')
    expect(headerLinkLabel('github.com/a')).toBe('Link')
  })

  it('builds a full address for a link without a protocol', () => {
    expect(headerLinkUrl('github.com/a')).toBe('https://github.com/a')
    expect(headerLinkUrl('http://x.test')).toBe('http://x.test')
  })
})
