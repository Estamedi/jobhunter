// In-app browsers of social and messaging apps. Google refuses OAuth inside them (disallowed_useragent).
const IN_APP_BROWSER_PATTERN =
  /Instagram|FBAN|FBAV|FB_IAB|Line\/|LinkedInApp|Snapchat|BytedanceWebview|musical_ly|Twitter|Telegram/i

/** Whether the page runs in an embedded web view where Google sign-in is blocked. */
export function isEmbeddedBrowser(userAgent = navigator.userAgent) {
  if (IN_APP_BROWSER_PATTERN.test(userAgent)) return true

  // A bare WKWebView on iOS omits the "Safari" token that Safari and SFSafariViewController send.
  if (/iPhone|iPad|iPod/.test(userAgent) && !/Safari/.test(userAgent))
    return true

  // Android WebView marks itself with "; wv)".
  return /Android.*;\s*wv\)/.test(userAgent)
}
