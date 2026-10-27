namespace backend.jobhunter.Infrastructure.AiProfileImport;

public static class ProfileImportPrompt
{
    public const string ProfileSchemaJson = """
    {
      "type": "object",
      "properties": {
        "headline": { "type": ["string", "null"], "description": "Professional headline, max 220 characters" },
        "summary": { "type": ["string", "null"], "description": "The CV's own summary/about text, max 2600 characters" },
        "phone": { "type": ["string", "null"], "description": "The candidate's own phone number as written, including country code if present" },
        "city": { "type": ["string", "null"], "description": "City of the candidate's current residence, from the CV header/contact block" },
        "country": { "type": ["string", "null"], "description": "Country of the candidate's current residence; use the full country name, also when only a city or country code is written" },
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
        },
        "educations": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "institution": { "type": "string" },
              "degree": { "type": "string" },
              "fieldOfStudy": { "type": ["string", "null"] },
              "location": { "type": ["string", "null"] },
              "startDate": { "type": ["string", "null"], "description": "YYYY-MM-01 or YYYY-01-01 when only a year is given; null if unknown" },
              "endDate": { "type": ["string", "null"] },
              "details": { "type": ["string", "null"], "description": "Grade, honours or activities, max 2000 characters" }
            },
            "required": ["institution", "degree", "fieldOfStudy", "location", "startDate", "endDate", "details"],
            "additionalProperties": false
          }
        },
        "skills": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "category": { "type": ["string", "null"], "description": "Group from the CV's skills section, e.g. Backend, Cloud, Tools" }
            },
            "required": ["name", "category"],
            "additionalProperties": false
          }
        },
        "projects": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "description": { "type": ["string", "null"], "description": "Max 2000 characters" },
              "url": { "type": ["string", "null"] },
              "startDate": { "type": ["string", "null"] },
              "endDate": { "type": ["string", "null"] }
            },
            "required": ["name", "description", "url", "startDate", "endDate"],
            "additionalProperties": false
          }
        },
        "certifications": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "issuer": { "type": ["string", "null"] },
              "issuedDate": { "type": ["string", "null"] },
              "expiryDate": { "type": ["string", "null"] },
              "credentialUrl": { "type": ["string", "null"] }
            },
            "required": ["name", "issuer", "issuedDate", "expiryDate", "credentialUrl"],
            "additionalProperties": false
          }
        },
        "languages": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "proficiency": {
                "type": ["string", "null"],
                "enum": ["Elementary", "LimitedWorking", "ProfessionalWorking", "FullProfessional", "NativeOrBilingual", null]
              }
            },
            "required": ["name", "proficiency"],
            "additionalProperties": false
          }
        },
        "links": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": { "type": "string", "description": "e.g. GitHub, LinkedIn, Portfolio" },
              "url": { "type": "string" }
            },
            "required": ["label", "url"],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "headline", "summary", "phone", "city", "country", "experiences", "educations", "skills",
        "projects", "certifications", "languages", "links"
      ],
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
               "- Phone, city and country: the candidate's own contact details, usually in the header. City and country are where they currently live, not an employer's location.\n" +
               "- Use null for anything not stated in the CV.\n" +
               "- Skills per role: only technologies or skills explicitly mentioned for that role.\n" +
               "- Education: one entry per degree or school; the degree is the qualification, fieldOfStudy the subject if separate.\n" +
               "- Skills: one entry per individual skill from the CV's skills section(s), with the section's group name as category when there is one.\n" +
               "- Projects: personal or notable projects listed on their own (not roles); keep names, descriptions and urls as written.\n" +
               "- Certifications: one entry per certificate or license.\n" +
               "- Languages: spoken languages with the closest proficiency level; null when the level is not stated.\n" +
               "- Links: profile and portfolio URLs (LinkedIn, GitHub, website) with a short label.\n\n" +
               $"CV text:\n{text}";
    }
}
