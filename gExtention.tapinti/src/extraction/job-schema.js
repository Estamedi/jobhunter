// Shared structured-output schema for both AI providers (Claude and OpenAI
// both accept the same JSON Schema shape for their respective structured
// output / strict-schema features).
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

export function buildExtractionPrompt(page) {
  return (
    "Extract the job posting details from this web page. " +
    "If the page is not a job posting, set every field to null.\n\n" +
    `Page URL: ${page.url}\nPage title: ${page.title}\n\n` +
    (page.jsonLd
      ? `Structured data found on the page:\n${JSON.stringify(page.jsonLd).slice(0, 8000)}\n\n`
      : "") +
    `Page text:\n${page.text}`
  );
}
