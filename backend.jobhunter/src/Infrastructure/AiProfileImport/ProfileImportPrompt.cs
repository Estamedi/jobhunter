namespace backend.jobhunter.Infrastructure.AiProfileImport;

public static class ProfileImportPrompt
{
    public const string ProfileSchemaJson = """
    {
      "type": "object",
      "properties": {
        "headline": { "type": ["string", "null"], "description": "Professional headline, max 220 characters" },
        "summary": { "type": ["string", "null"], "description": "The CV's own summary/about text, max 2600 characters" },
        "experiences": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "employmentType": {
                "type": ["string", "null"],
                "enum": ["FullTime", "PartTime", "Contract", "Freelance", "Internship", "SelfEmployed", null]
              },
              "company": { "type": "string" },
              "isCurrent": { "type": "boolean" },
              "startDate": { "type": ["string", "null"], "description": "YYYY-MM-01; use YYYY-01-01 when only a year is given; null if unknown" },
              "endDate": { "type": ["string", "null"], "description": "YYYY-MM-01; null for a current role" },
              "location": { "type": ["string", "null"] },
              "workplaceType": { "type": ["string", "null"], "enum": ["OnSite", "Hybrid", "Remote", null] },
              "description": { "type": ["string", "null"], "description": "Achievements as lines starting with '• ', max 2000 characters" },
              "skills": { "type": "array", "items": { "type": "string" }, "description": "Up to 8 technologies/skills used in this role" }
            },
            "required": [
              "title", "employmentType", "company", "isCurrent", "startDate", "endDate",
              "location", "workplaceType", "description", "skills"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": ["headline", "summary", "experiences"],
      "additionalProperties": false
    }
    """;

    private const int MaxTextLength = 30000;

    public static string BuildPrompt(string cvText)
    {
        var text = cvText.Length <= MaxTextLength ? cvText : cvText[..MaxTextLength];

        return "Extract the candidate's professional profile from this CV text.\n\n" +
               "Rules:\n" +
               "- Copy facts exactly as written; never invent employers, titles, dates or achievements.\n" +
               "- One experience entry per role. If a company lists several roles, create one entry per role.\n" +
               "- Write each achievement on its own line starting with '• ' in the description; keep the CV's wording and any metrics.\n" +
               "- Dates use YYYY-MM-01. 'Present'/'Current' means isCurrent=true and endDate=null.\n" +
               "- Use null for anything not stated in the CV.\n" +
               "- Skills per role: only technologies or skills explicitly mentioned for that role.\n" +
               "- Ignore skills lists, projects, education, links and languages sections; they are not part of this extraction.\n\n" +
               $"CV text:\n{text}";
    }
}
