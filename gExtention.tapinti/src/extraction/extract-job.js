import { extractJobViaBackend } from "../api/extraction.js";
import { basicExtract } from "./basic-extract.js";

// Extracts job details for `page` via the backend's AI extraction endpoint
// (the backend holds the provider API keys and decides which one to use),
// falling back to the offline heuristic parser if that call fails —
// `onFallback` is called with the error in that case.
export async function extractJob(page, { status, onFallback }) {
  status.textContent = "Extracting job details…";
  try {
    return await extractJobViaBackend(page);
  } catch (err) {
    console.warn("Backend extraction failed, using basic parser:", err);
    onFallback(err);
    return basicExtract(page);
  }
}
