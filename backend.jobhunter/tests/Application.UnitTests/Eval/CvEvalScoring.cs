using System.Text.RegularExpressions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts;

namespace backend.jobhunter.Application.UnitTests.Eval;

public record CvEvalMetrics
{
    public int Score { get; init; }
    public int MustHaveTotal { get; init; }
    public int MustHaveInText { get; init; }
    public int MustHaveSkillsOnly { get; init; }
    public bool HeadlineHasJobTitle { get; init; }
    public int SkillCount { get; init; }
    public double AverageBullets { get; init; }
    public int Words { get; init; }
    public int TargetWords { get; init; }
    public int GroundingIssues { get; init; }
    public int CopiedRuns { get; init; }
}

public record CvEvalRow(string Fixture, List<string> FailedGates, CvEvalMetrics Metrics, string? Error = null)
{
    public bool Passed => Error is null && FailedGates.Count == 0;
}

// Scores one generated CV. Hard gates are honesty and format rules that must always hold; the metrics are
// shown and compared between runs but are not pass or fail on their own.
public static partial class CvEvalScoring
{
    private static readonly string[] AllHeadings =
        ["Summary", "Technical Skills", "Professional Experience", "Projects", "Education", "Certifications", "Additional Information"];

    [GeneratedRegex(@"(?<=[.!?])\s+")]
    private static partial Regex SentenceBreak();

    public static CvEvalRow Evaluate(
        CvEvalFixture fixture, GeneratedCvDto cv, CvBackground background,
        int groundingIssues, int copiedRuns, string atsText, int? targetPages)
    {
        var failed = new List<string>();
        if (groundingIssues > 0) failed.Add($"grounding ({groundingIssues} issue{(groundingIssues == 1 ? "" : "s")})");
        if (copiedRuns > 0) failed.Add($"copied from the job ({copiedRuns})");

        failed.AddRange(AtsProblems(cv, fixture.Header.FullName, fixture.Header.Email, atsText));

        var bullets = cv.Experience.SelectMany(j => j.Bullets).Select(Clean).ToList();
        var prose = new List<string> { Clean(cv.Headline), Clean(cv.Summary) };
        prose.AddRange(bullets);
        var allText = string.Join("\n", prose);

        failed.AddRange(fixture.Expect.ForbidInText.Where(t => CvJobMatcher.ContainsTerm(allText, t)).Select(t => $"forbidden in text: {t}"));
        failed.AddRange(fixture.Expect.ForbidInBullets.Where(t => bullets.Any(b => CvJobMatcher.ContainsTerm(b, t))).Select(t => $"forbidden in a bullet: {t}"));
        // Employer names sit in the entry's company field, not in a bullet, so those count for "required".
        var entryText = string.Join("\n", cv.Experience.Select(j => $"{j.Company}\n{j.Role}"));
        failed.AddRange(fixture.Expect.RequireInText
            .Where(t => !CvJobMatcher.ContainsTerm(allText, t) && !CvJobMatcher.ContainsTerm(entryText, t))
            .Select(t => $"missing: {t}"));

        var sentences = SentenceBreak().Split(Clean(cv.Summary)).Concat(bullets).ToList();
        foreach (var pair in fixture.Expect.ForbidPairs.Where(p => p.Count == 2))
        {
            if (sentences.Any(s => CvJobMatcher.ContainsTerm(s, pair[0]) && CvJobMatcher.ContainsTerm(s, pair[1])))
            {
                failed.Add($"wrong attribution: \"{pair[0]}\" and \"{pair[1]}\" in one sentence");
            }
        }

        var match = CvJobMatcher.Match(fixture.Requirements, cv, background.Text);
        var must = match.Requirements.Where(r => r.MustHave).ToList();
        var skills = cv.Skills.SelectMany(g => g.Items).Count(i => !string.IsNullOrWhiteSpace(i));
        var roles = cv.Experience.Count;
        var words = prose.Sum(WordCount) + cv.Skills.SelectMany(g => g.Items).Sum(WordCount);

        return new CvEvalRow(fixture.Name, failed, new CvEvalMetrics
        {
            Score = CvScorer.Score(cv).Overall,
            MustHaveTotal = must.Count,
            MustHaveInText = must.Count(r => r.Status == RequirementStatus.InCv),
            MustHaveSkillsOnly = must.Count(r => r.Status == RequirementStatus.SkillsOnly),
            HeadlineHasJobTitle = Clean(cv.Headline).Contains(fixture.Job.Title, StringComparison.OrdinalIgnoreCase),
            SkillCount = skills,
            AverageBullets = roles == 0 ? 0 : Math.Round((double)bullets.Count / roles, 1),
            Words = words,
            TargetWords = targetPages is null ? 0 : targetPages == 1 ? 450 : 800,
            GroundingIssues = groundingIssues,
            CopiedRuns = copiedRuns,
        });
    }

    // What an applicant tracking system would see: the sections in reading order, with the name and
    // contact details before the summary. Only headings the CV actually has are checked.
    public static List<string> AtsProblems(GeneratedCvDto cv, string fullName, string? email, string text)
    {
        var problems = new List<string>();
        var summary = text.IndexOf("Summary", StringComparison.Ordinal);
        var firstHeading = AllHeadings.Select(h => text.IndexOf(h, StringComparison.Ordinal)).Where(i => i >= 0).DefaultIfEmpty(-1).Min();
        var limit = summary >= 0 ? summary : firstHeading;

        if (text.IndexOf(fullName, StringComparison.Ordinal) is var n && (n < 0 || (limit >= 0 && n > limit)))
        {
            problems.Add("ATS: the name is not at the top");
        }
        if (!string.IsNullOrWhiteSpace(email) && text.IndexOf(email, StringComparison.Ordinal) is var m && (m < 0 || (limit >= 0 && m > limit)))
        {
            problems.Add("ATS: contact details are not at the top");
        }

        var expected = new List<string>();
        if (!string.IsNullOrWhiteSpace(cv.Summary)) expected.Add("Summary");
        if (cv.Skills.Count > 0) expected.Add("Technical Skills");
        if (cv.Experience.Count > 0) expected.Add("Professional Experience");
        if (cv.Projects.Count > 0) expected.Add("Projects");
        if (cv.Education.Count > 0) expected.Add("Education");
        if (cv.Certifications.Count > 0) expected.Add("Certifications");
        var positions = expected.Select(h => text.IndexOf(h, StringComparison.Ordinal)).ToList();
        if (positions.Any(p => p < 0)) problems.Add("ATS: a heading is missing from the extracted text");
        else if (!positions.SequenceEqual(positions.OrderBy(p => p))) problems.Add("ATS: headings are out of order");

        return problems;
    }

    private static string Clean(string? text) => (text ?? string.Empty).Replace("**", string.Empty).Trim();

    private static int WordCount(string text) => text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;
}
