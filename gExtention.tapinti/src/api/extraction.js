import { api } from "./client.js";

// Sends the raw page content to the Tapinti backend, which runs the AI
// extraction server-side (API keys live only in backend config). The backend
// enforces auth (and, later, per-user extraction entitlements/usage).
export async function extractJobViaBackend(page) {
  return api("/api/JobExtraction", {
    method: "POST",
    body: JSON.stringify({
      url: page.url,
      title: page.title,
      jsonLd: page.jsonLd ? JSON.stringify(page.jsonLd) : null,
      text: page.text,
    }),
  });
}
