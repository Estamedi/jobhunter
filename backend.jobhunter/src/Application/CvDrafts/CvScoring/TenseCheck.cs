using backend.jobhunter.Application.Common.Interfaces;
using static backend.jobhunter.Application.CvDrafts.CvScoreText;

namespace backend.jobhunter.Application.CvDrafts;

// A role that has ended should read in the past tense. Only that direction is checked: a current role may
// mix tenses (what you did, what you do now). A single present-tense opener could be a noun phrase
// ("Test automation..."), so a role is flagged only when at least two of its bullets open that way.
internal sealed class TenseCheck : ICvScoreCheck
{
    private const int MinPresentBullets = 2;

    public int Weight => 5;

    public CvScoreCheckDto Run(GeneratedCvDto cv)
    {
        var issues = new List<CvScoreIssueDto>();

        for (var i = 0; i < cv.Experience.Count; i++)
        {
            var e = cv.Experience[i];
            if (IsCurrent(e.EndDate)) continue;

            var present = e.Bullets
                .Select((b, bi) => new Bullet(i, bi, Clean(b)))
                .Where(b => b.Text.Length > 0 && ActionVerbs.IsPresentTense(FirstWord(b.Text)))
                .ToList();
            if (present.Count >= MinPresentBullets)
            {
                issues.Add(new(
                    $"{e.Role} at {e.Company} has ended, but {present.Count} bullets are in the present tense. Use the past tense.",
                    present.Select(At).ToList()));
            }
        }

        return new("tense", "Tense", "Past roles in the past tense.", Penalty(issues.Count, 2.5), null, issues);
    }

    private static bool IsCurrent(string? endDate)
        => string.IsNullOrWhiteSpace(endDate)
           || endDate.Trim().Equals("present", StringComparison.OrdinalIgnoreCase)
           || endDate.Trim().Equals("current", StringComparison.OrdinalIgnoreCase);
}
