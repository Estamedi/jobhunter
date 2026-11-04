namespace backend.jobhunter.Domain.Constants;

public static class AiSettingKeys
{
    public const string Provider = "Ai.Provider";

    /// <summary>Per-action override keys: "Ai.Action.{action}.Provider" and "Ai.Action.{action}.Model".</summary>
    public static string ActionProvider(string action) => $"Ai.Action.{action}.Provider";

    public static string ActionModel(string action) => $"Ai.Action.{action}.Model";
}

/// <summary>The AI-powered actions an administrator can give their own provider and model. Values match the schema names AiJsonClient receives.</summary>
public static class AiActions
{
    public const string JobPosting = "job_posting";
    public const string JobRequirements = "job_requirements";
    public const string Cv = "cv";
    public const string Profile = "profile";

    public static readonly IReadOnlyList<(string Key, string Label, string Description, bool HeavyModel)> All =
    [
        (JobPosting, "Job posting extraction", "Reads a job page captured by the browser extension into structured fields.", false),
        (JobRequirements, "Job requirements extraction", "Pulls must-have and nice-to-have requirements out of a job description before a CV is written.", false),
        (Cv, "CV generation", "Writes and refines tailored CVs.", true),
        (Profile, "Profile import", "Parses an uploaded CV into the candidate profile.", true),
    ];
}
