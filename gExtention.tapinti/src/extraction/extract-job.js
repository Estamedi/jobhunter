import { settings } from "../settings.js";
import { claudeExtract } from "./claude-extract.js";
import { openaiExtract } from "./openai-extract.js";
import { basicExtract } from "./basic-extract.js";

// Prefers settings.aiProvider, but falls back to whichever provider actually
// has a key configured — so setting just one key always works regardless of
// which provider is selected.
function pickAiExtractor() {
  const providers = settings.aiProvider === "openai"
    ? [["OpenAI", settings.openaiKey, openaiExtract], ["Claude", settings.anthropicKey, claudeExtract]]
    : [["Claude", settings.anthropicKey, claudeExtract], ["OpenAI", settings.openaiKey, openaiExtract]];

  const match = providers.find(([, key]) => key);
  return match ? { name: match[0], run: match[2] } : null;
}

// Extracts job details for `page`, using AI if any provider key is
// configured (updating `status` with progress), and falling back to the
// offline heuristic parser if no key is set or the AI call fails —
// `onFallback` is called with the error in the latter case.
export async function extractJob(page, { status, onFallback }) {
  const provider = pickAiExtractor();
  if (!provider) return basicExtract(page);

  status.textContent = `Extracting job details with ${provider.name}…`;
  try {
    return await provider.run(page);
  } catch (err) {
    console.warn(`${provider.name} extraction failed, using basic parser:`, err);
    onFallback(err);
    return basicExtract(page);
  }
}
