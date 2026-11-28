import { describe, expect, it } from 'vitest'
import { isEmbeddedBrowser } from './embedded-browser'

const IOS_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const IOS_INSTAGRAM =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0'
const IOS_WKWEBVIEW =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
const ANDROID_WEBVIEW =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'

describe('isEmbeddedBrowser', () => {
  it('allows regular browsers', () => {
    expect(isEmbeddedBrowser(IOS_SAFARI)).toBe(false)
    expect(isEmbeddedBrowser(ANDROID_CHROME)).toBe(false)
  })

  it('detects in-app and web view browsers', () => {
    expect(isEmbeddedBrowser(IOS_INSTAGRAM)).toBe(true)
    expect(isEmbeddedBrowser(IOS_WKWEBVIEW)).toBe(true)
    expect(isEmbeddedBrowser(ANDROID_WEBVIEW)).toBe(true)
  })
})
