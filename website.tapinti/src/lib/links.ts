/** Single source of truth for external app links. */
export const APP_URL = "https://app.applyladder.com";
export const SIGN_UP_URL = `${APP_URL}/sign-up`;
export const SIGN_IN_URL = `${APP_URL}/sign-in`;
export const CHROME_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/applyladder-job-saver/cgcbolcpejagpjpdkdmgppkcohclhcen";

/** Backend API. Only used server-side (the consultation form posts to our own /api/consultation). */
export const API_URL = process.env.API_URL ?? "https://api.applyladder.com";
