import { settings } from "../settings.js";
import { JOB_SCHEMA, buildExtractionPrompt } from "./job-schema.js";

const MODEL = "gpt-4o-mini";

export async function openaiExtract(page) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.openaiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: {
        type: "json_schema",
        json_schema: { name: "job_posting", strict: true, schema: JOB_SCHEMA },
      },
      messages: [{ role: "user", content: buildExtractionPrompt(page) }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAI API ${res.status}\n${body.slice(0, 300)}`);
  }
  const msg = await res.json();
  const choice = msg.choices?.[0]?.message;
  if (choice?.refusal) {
    throw new Error("The AI declined to process this page.");
  }
  const text = choice?.content;
  if (!text) throw new Error("Empty AI response.");
  return JSON.parse(text);
}
