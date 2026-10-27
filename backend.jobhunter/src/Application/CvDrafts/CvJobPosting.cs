namespace backend.jobhunter.Application.CvDrafts;

public static class CvJobPosting
{
    // What the AI tailors a CV to: the posting's description plus its requirements. Same shape the
    // UI builds in lib/job-text.ts, so a draft made from an application matches one made from the form.
    public static string? Compose(string? description, string? requirements)
    {
        var parts = new[]
        {
            description?.Trim(),
            string.IsNullOrWhiteSpace(requirements) ? null : $"Requirements:\n{requirements.Trim()}",
        }.Where(p => !string.IsNullOrWhiteSpace(p));

        var text = string.Join("\n\n", parts);
        return text.Length == 0 ? null : text;
    }
}
