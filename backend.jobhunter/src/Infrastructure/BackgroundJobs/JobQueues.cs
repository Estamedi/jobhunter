namespace backend.jobhunter.Infrastructure.BackgroundJobs;

// Hangfire queue names: lower-case letters, digits, dashes and underscores only.
public static class JobQueues
{
    public const string CvGeneration = "cv-generation";
    public const string ProfileImport = "profile-import";
    public const string CvUpload = "cv-upload";
    public const string Email = "email";

    public static readonly string[] All = [CvGeneration, ProfileImport, CvUpload, Email, "default"];
}
