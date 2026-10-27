namespace backend.jobhunter.Application.CvDrafts;

// The CEFR level the CV text is written at. It sets how plain or sophisticated the wording is, not
// what the CV says, so a candidate can match the CV to their own command of the language.
public static class CvLanguageLevel
{
    public const string Default = "B2";

    public static readonly string[] All = ["A2", "B1", "B2", "C1", "C2"];

    public static bool IsValid(string? level)
        => string.IsNullOrWhiteSpace(level) || All.Contains(level.Trim(), StringComparer.OrdinalIgnoreCase);

    // Anything missing or unknown (for example a draft made before levels existed) falls back to B2.
    public static string Normalize(string? level)
        => All.FirstOrDefault(l => string.Equals(l, level?.Trim(), StringComparison.OrdinalIgnoreCase)) ?? Default;

    public static string Describe(string level) => Normalize(level) switch
    {
        "A2" => "very simple wording: short sentences and everyday words",
        "B1" => "simple, clear sentences and common words; no idioms",
        "C1" => "fluent, precise professional prose with a wide vocabulary and varied sentence structure",
        "C2" => "polished, sophisticated prose with nuanced vocabulary",
        _ => "clear, natural professional wording: common business vocabulary and moderately complex sentences",
    };
}
