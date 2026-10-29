using backend.jobhunter.Application.Common.Interfaces;
using static backend.jobhunter.Application.CvDrafts.CvScoreText;

namespace backend.jobhunter.Application.CvDrafts;

// Empty phrases recruiters skip, looked for in the summary and every bullet.
internal sealed class BuzzwordsCheck : ICvScoreCheck
{
    private static readonly string[] Buzzwords =
    [
        "team player", "hard-working", "hardworking", "results-driven", "results-oriented", "go-getter",
        "self-starter", "detail-oriented", "think outside the box", "synergy", "dynamic", "passionate",
        "motivated", "people person", "fast learner", "strong work ethic",
    ];

    public int Weight => 8;

    public CvScoreCheckDto Run(GeneratedCvDto cv)
    {
        var issues = new List<CvScoreIssueDto>();
        var summary = Clean(cv.Summary);
        var texts = new List<(CvScoreLocationDto Where, string Text)> { (new("summary", null, null, summary), summary) };
        texts.AddRange(Bullets(cv).Select(b => (At(b), b.Text)));

        foreach (var (where, text) in texts)
        {
            var lower = text.ToLowerInvariant();
            foreach (var word in Buzzwords.Where(w => lower.Contains(w)))
            {
                issues.Add(new($"\"{word}\" is a cliché recruiters skip. Show it with a result instead.", [where]));
            }
        }

        return new("buzzwords", "Buzzwords", "Replace empty phrases with proof.",
            Penalty(issues.Count, 2.5), null, issues);
    }
}
