import { settings } from "../settings.js";

export const JOB_SCHEMA = {
  type: "object",
  properties: {
    jobTitle: { type: ["string", "null"], description: "The job position title" },
    companyName: { type: ["string", "null"], description: "The hiring company name" },
    companyWebsite: { type: ["string", "null"] },
    country: { type: ["string", "null"] },
    city: { type: ["string", "null"] },
    workType: { type: ["string", "null"], enum: ["Remote", "Hybrid", "Onsite", null] },
    employmentType: {
      type: ["string", "null"],
      enum: ["FullTime", "PartTime", "Contract", "Internship", null],
    },
    salaryMin: { type: ["number", "null"] },
    salaryMax: { type: ["number", "null"] },
    currency: { type: ["string", "null"], description: "ISO currency code, e.g. USD" },
    source: {
      type: ["string", "null"],
      description: "Job board name, e.g. LinkedIn, Indeed, or CompanyWebsite",
    },
    description: {
      type: ["string", "null"],
      description: "Concise summary of the role (max ~150 words)",
    },
    requirements: {
      type: ["string", "null"],
      description: "Key requirements as a short bullet list",
    },
  },
  required: [
    "jobTitle", "companyName", "companyWebsite", "country", "city", "workType",
    "employmentType", "salaryMin", "salaryMax", "currency", "source",
    "description", "requirements",
  ],
  additionalProperties: false,
};

export async function aiExtract(page) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": settings.anthropicKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      output_config: { format: { type: "json_schema", schema: JOB_SCHEMA } },
      messages: [
        {
          role: "user",
          content:
            "Extract the job posting details from this web page. " +
            "If the page is not a job posting, set every field to null.\n\n" +
            `Page URL: ${page.url}\nPage title: ${page.title}\n\n` +
            (page.jsonLd
              ? `Structured data found on the page:\n${JSON.stringify(page.jsonLd).slice(0, 8000)}\n\n`
              : "") +
            `Page text:\n${page.text}`,
        },
      ],
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
