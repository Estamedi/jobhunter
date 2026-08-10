using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Infrastructure.AiExtraction;

// Shared structured-output schema for both AI providers (Claude and OpenAI
// both accept the same JSON Schema shape for their respective structured
// output / strict-schema features).
public static class JobExtractionPrompt
{
    public const string JobSchemaJson = """
    {
      "type": "object",
      "properties": {
        "jobTitle": { "type": ["string", "null"], "description": "The job position title" },
        "companyName": { "type": ["string", "null"], "description": "The hiring company name" },
        "companyWebsite": { "type": ["string", "null"] },
        "country": { "type": ["string", "null"] },
        "city": { "type": ["string", "null"] },
        "workType": { "type": ["string", "null"], "enum": ["Remote", "Hybrid", "Onsite", null] },
        "employmentType": {
          "type": ["string", "null"],
          "enum": ["FullTime", "PartTime", "Contract", "Internship", null]
        },
        "salaryMin": { "type": ["number", "null"] },
        "salaryMax": { "type": ["number", "null"] },
        "currency": { "type": ["string", "null"], "description": "ISO currency code, e.g. USD" },
        "source": {
          "type": ["string", "null"],
          "description": "Job board name, e.g. LinkedIn, Indeed, or CompanyWebsite"
        },
        "description": {
          "type": ["string", "null"],
          "description": "Concise summary of the role (max ~150 words)"
        },
        "requirements": {
          "type": ["string", "null"],
          "description": "Key requirements as a short bullet list"
        }
      },
      "required": [
        "jobTitle", "companyName", "companyWebsite", "country", "city", "workType",
        "employmentType", "salaryMin", "salaryMax", "currency", "source",
        "description", "requirements"
      ],
      "additionalProperties": false
    }
    """;

    public static string BuildPrompt(JobPageContent page)
    {
        var jsonLdSection = string.IsNullOrEmpty(page.JsonLd)
            ? ""
            : $"Structured data found on the page:\n{Truncate(page.JsonLd, 8000)}\n\n";

        return "Extract the job posting details from this web page. " +
               "If the page is not a job posting, set every field to null.\n\n" +
               $"Page URL: {page.Url}\nPage title: {page.Title}\n\n" +
               jsonLdSection +
               $"Page text:\n{page.Text}";
    }

    private static string Truncate(string value, int maxLength)
        => value.Length <= maxLength ? value : value[..maxLength];
}
