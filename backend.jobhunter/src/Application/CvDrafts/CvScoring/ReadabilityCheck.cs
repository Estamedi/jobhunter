using backend.jobhunter.Application.Common.Interfaces;
using static backend.jobhunter.Application.CvDrafts.CvScoreText;

namespace backend.jobhunter.Application.CvDrafts;

// Long bullets, a long or missing summary and a long headline are hard to skim.
internal sealed class ReadabilityCheck : ICvScoreCheck
{
    private const int MaxBulletWords = 30;
    private const int MaxSummaryWords = 90;
    private const int MaxHeadlineLength = 70;

    public int Weight => 8;

    public CvScoreCheckDto Run(GeneratedCvDto cv)
    {
        var issues = new List<CvScoreIssueDto>();

        foreach (var b in Bullets(cv).Where(b => Words(b.Text) > MaxBulletWords))
        {
            issues.Add(new($"{Words(b.Text)} words. Keep bullets under {MaxBulletWords}.", [At(b)]));
        }

        var summary = Clean(cv.Summary);
        if (summary.Length == 0)
        {
            issues.Add(new("There is no summary.", []));
        }
        else if (Words(summary) > MaxSummaryWords)
        {
            issues.Add(new($"The summary is {Words(summary)} words. Keep it under {MaxSummaryWords}.",
                [new("summary", null, null, summary)]));
        }

        if (Clean(cv.Headline).Length > MaxHeadlineLength)
        {
            issues.Add(new("The headline is too long. Keep it on one short line.",
                [new("headline", null, null, Clean(cv.Headline))]));
        }

        return new("readability", "Readability", "Keep it short enough to skim in seconds.",
            Penalty(issues.Count, 2), null, issues);
    }
}
