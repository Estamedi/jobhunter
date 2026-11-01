using System.Text.RegularExpressions;
using backend.jobhunter.Application.Common.Interfaces;
using static backend.jobhunter.Application.CvDrafts.CvScoreText;

namespace backend.jobhunter.Application.CvDrafts;

// Structural patterns that read as machine-written (from claude-resume-kit's AI fingerprint rules):
// bullets ending on a trailing "-ing" phrase, stacked "-ing" phrases, too many em-dashes, and a summary
// whose sentences are all the same length.
internal sealed partial class AiPatternsCheck : ICvScoreCheck
{
    private const int MaxEmDashes = 2;

    // "-ing" words that introduce a method or reference, not a vague analysis ending.
    private static readonly HashSet<string> MethodWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "using", "including", "following", "during", "regarding", "according", "leading", "existing",
    };

    // ", improving testability and maintainability." with no number to end on.
    [GeneratedRegex(@",\s+([A-Za-z]+ing)\b([^,;.]*)\.?$")]
    private static partial Regex TrailingIng();

    // Three or more comma-separated clauses that each start with an "-ing" word.
    [GeneratedRegex(@"\b[A-Za-z]{3,}ing\b[^,.;]*,\s*(?:and\s+)?\b[A-Za-z]{3,}ing\b[^,.;]*,\s*(?:and\s+)?\b[A-Za-z]{3,}ing\b")]
    private static partial Regex StackedIng();

    public int Weight => 8;

    public CvScoreCheckDto Run(GeneratedCvDto cv)
    {
        var issues = new List<CvScoreIssueDto>();
        var summary = Clean(cv.Summary);
        var bullets = Bullets(cv);

        foreach (var b in bullets)
        {
            var match = TrailingIng().Match(b.Text);
            if (match.Success && !MethodWords.Contains(match.Groups[1].Value) && !match.Value.Any(char.IsDigit))
            {
                issues.Add(new("Ends on a vague \"-ing\" phrase. End on a concrete result, number or object instead.", [At(b)]));
            }

            if (StackedIng().IsMatch(b.Text))
            {
                issues.Add(new("Stacks three or more \"-ing\" phrases. Use fewer, more specific verbs.", [At(b)]));
            }
        }

        var all = new List<(CvScoreLocationDto Where, string Text)> { (new("summary", null, null, summary), summary) };
        all.AddRange(bullets.Select(b => (At(b), b.Text)));
        var dashed = all.Where(t => CountEmDashes(t.Text) > 0).ToList();
        if (dashed.Sum(t => CountEmDashes(t.Text)) > MaxEmDashes)
        {
            issues.Add(new($"More than {MaxEmDashes} em-dashes in the CV. Use commas, colons or full stops instead.",
                dashed.Select(t => t.Where).ToList()));
        }

        if (SimilarSentenceRun(summary))
        {
            issues.Add(new("Three summary sentences in a row are about the same length. Mix short and long ones.",
                [new("summary", null, null, summary)]));
        }

        return new("ai-patterns", "AI-sounding patterns", "Avoid structures that read as machine-written.",
            Penalty(issues.Count, 2.5), null, issues);
    }

    private static int CountEmDashes(string text) => text.Count(c => c == '—') + Regex.Matches(text, "---").Count;

    private static bool SimilarSentenceRun(string summary)
    {
        var lengths = Regex.Split(summary, @"(?<=[.!?])\s+")
            .Select(Words).Where(n => n > 0).ToList();
        for (var i = 0; i + 2 < lengths.Count; i++)
        {
            var run = lengths.Skip(i).Take(3).ToList();
            if (run.Max() - run.Min() <= 3) return true;
        }
        return false;
    }
}
