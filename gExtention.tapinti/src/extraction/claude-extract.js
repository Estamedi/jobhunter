import { settings } from "../settings.js";
import { JOB_SCHEMA, buildExtractionPrompt } from "./job-schema.js";

const MODEL = "claude-opus-4-8";

export async function claudeExtract(page) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": settings.anthropicKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      output_config: { format: { type: "json_schema", schema: JOB_SCHEMA } },
      messages: [{ role: "user", content: buildExtractionPrompt(page) }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Claude API ${res.status}\n${body.slice(0, 300)}`);
  }
  const msg = await res.json();
  if (msg.stop_reason === "refusal") {
    throw new Error("The AI declined to process this page.");
  }
  const text = msg.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Empty AI response.");
  return JSON.parse(text);
}
