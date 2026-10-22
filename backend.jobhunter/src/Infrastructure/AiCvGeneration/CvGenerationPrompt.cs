using System.Text;
using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Infrastructure.AiCvGeneration;

// Shared structured-output schema for both AI providers (same JSON Schema shape works for
// Claude's output_config and OpenAI's strict json_schema).
public static class CvGenerationPrompt
{
    public const string CvSchemaJson = """
    {
      "type": "object",
      "properties": {
        "headline": { "type": "string", "description": "One-line professional headline aligned with the target job title" },
        "summary": { "type": "string", "description": "Professional summary, 3-4 sentences" },
        "skills": {
          "type": "array",
          "description": "Skills grouped by category, e.g. Backend, Cloud, Tools",
          "items": {
            "type": "object",
            "properties": {
              "category": { "type": "string" },
              "items": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["category", "items"],
            "additionalProperties": false
          }
        },
        "projects": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "description": { "type": ["string", "null"] },
              "url": { "type": ["string", "null"] }
            },
            "required": ["name", "description", "url"],
            "additionalProperties": false
          }
        },
        "experience": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "role": { "type": "string" },
              "company": { "type": "string" },
              "location": { "type": ["string", "null"] },
              "startDate": { "type": ["string", "null"] },
              "endDate": { "type": ["string", "null"], "description": "Null or 'Present' for a current role" },
              "bullets": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["role", "company", "location", "startDate", "endDate", "bullets"],
            "additionalProperties": false
          }
        },
        "education": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "degree": { "type": "string" },
              "institution": { "type": "string" },
              "startDate": { "type": ["string", "null"] },
              "endDate": { "type": ["string", "null"] },
              "details": { "type": ["string", "null"] }
            },
            "required": ["degree", "institution", "startDate", "endDate", "details"],
            "additionalProperties": false
          }
        },
        "certifications": { "type": "array", "items": { "type": "string" } },
        "languages": { "type": "array", "items": { "type": "string" } },
        "links": { "type": "array", "items": { "type": "string" }, "description": "Profile and portfolio URLs found in the background" }
      },
      "required": ["headline", "summary", "skills", "projects", "experience", "education", "certifications", "languages", "links"],
      "additionalProperties": false
    }
    """;

    private const int MaxFieldLength = 20000;

    public static string BuildPrompt(CvGenerationRequest request)
    {
        var sb = new StringBuilder();
        sb.AppendLine("You are an expert CV writer. Write a CV tailored to the target job.");
        sb.AppendLine();
        sb.AppendLine("Rules:");
        sb.AppendLine("- Use ONLY facts present in the candidate background below. Never invent employers, roles, dates, degrees, certifications, skills or metrics.");
        sb.AppendLine("- If the background lacks information for a section, return an empty list for it.");
        sb.AppendLine("- Mirror relevant keywords from the job description where the candidate's background genuinely supports them.");
        sb.AppendLine("- Keep it ATS-friendly: plain wording, concise action-led bullets, most relevant experience first.");
        sb.AppendLine("- Wrap key technologies, metrics and achievements in **double asterisks** to render them bold, sparingly (summary and bullets only).");
        sb.AppendLine($"- Tone: {request.Tone ?? "professional"}. Language: {request.Language ?? "English"}.");
        sb.AppendLine();
        sb.AppendLine($"Candidate: {request.FullName}");
        if (!string.IsNullOrWhiteSpace(request.Location)) sb.AppendLine($"Location: {request.Location}");
        sb.AppendLine();
        sb.AppendLine($"Target job title: {request.JobTitle}");
        if (!string.IsNullOrWhiteSpace(request.JobDescription))
        {
            sb.AppendLine("Job description:");
            sb.AppendLine(Truncate(request.JobDescription));
        }
        if (!string.IsNullOrWhiteSpace(request.Instructions))
        {
            sb.AppendLine();
            sb.AppendLine("Additional instructions from the candidate:");
            sb.AppendLine(Truncate(request.Instructions));
        }
        sb.AppendLine();
        sb.AppendLine("Candidate background (source of truth):");
        sb.AppendLine(string.IsNullOrWhiteSpace(request.BackgroundText) ? "(none provided)" : Truncate(request.BackgroundText));
        return sb.ToString();
    }

    public static string BuildRefinePrompt(CvSectionRefineRequest request)
    {
        var sb = new StringBuilder();
        sb.AppendLine("You are an expert CV writer. Below is a candidate's current CV as JSON.");
        sb.AppendLine($"Rewrite ONLY the \"{request.Section}\" section following the instruction, and return the full CV JSON with every other section copied unchanged.");
        sb.AppendLine();
        sb.AppendLine("Rules:");
        sb.AppendLine("- Use ONLY facts present in the current CV or the candidate background. Never invent employers, roles, dates, degrees, certifications, skills or metrics.");
        sb.AppendLine("- Keep it ATS-friendly: plain wording, concise action-led bullets.");
        sb.AppendLine("- Keep **double asterisk** bold markers on key terms, as in the current CV.");
        sb.AppendLine();
        if (!string.IsNullOrWhiteSpace(request.JobTitle)) sb.AppendLine($"Target job title: {request.JobTitle}");
        if (!string.IsNullOrWhiteSpace(request.JobDescription))
        {
            sb.AppendLine("Job description:");
            sb.AppendLine(Truncate(request.JobDescription));
        }
        sb.AppendLine();
        sb.AppendLine($"Instruction: {Truncate(request.Instruction)}");
        sb.AppendLine();
        sb.AppendLine("Current CV:");
        sb.AppendLine(System.Text.Json.JsonSerializer.Serialize(request.Current, new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web)));
        if (!string.IsNullOrWhiteSpace(request.BackgroundText))
        {
            sb.AppendLine();
            sb.AppendLine("Candidate background (source of truth):");
            sb.AppendLine(Truncate(request.BackgroundText));
        }
        return sb.ToString();
    }

    private static string Truncate(string value)
        => value.Length <= MaxFieldLength ? value : value[..MaxFieldLength];
}
