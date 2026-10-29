using backend.jobhunter.Application.Common.Interfaces;
using static backend.jobhunter.Application.CvDrafts.CvScoreText;

namespace backend.jobhunter.Application.CvDrafts;

// Flags bullets that open with a weak phrase or are too short to show an achievement, and recent roles
// with too few bullets. It matches words only; it cannot judge how good a bullet really is.
internal sealed class WeakRolesCheck : ICvScoreCheck
{
    private const int MinBulletWords = 6;
    private const int RecentRoles = 2;
    private const int MinBulletsInRecentRole = 3;

    private static readonly string[] WeakOpeners =
    [
        "responsible for", "helped", "worked on", "assisted", "involved in", "duties included", "tasked with",
        "participated in", "was part of",
    ];

    public int Weight => 20;

    public CvScoreCheckDto Run(GeneratedCvDto cv)
    {
        var issues = new List<CvScoreIssueDto>();

        foreach (var b in Bullets(cv))
        {
            var lower = b.Text.ToLowerInvariant();
            var opener = WeakOpeners.FirstOrDefault(w => lower.StartsWith(w));
            if (opener is not null)
            {
                issues.Add(new($"Starts with \"{opener}\". Open with what you did and the result.", [At(b)]));
            }
            else if (Words(b.Text) < MinBulletWords)
            {
                issues.Add(new("Too short to show what you achieved.", [At(b)]));
            }
        }

        // The most recent roles carry the most weight, so a thin one stands out.
        for (var i = 0; i < Math.Min(RecentRoles, cv.Experience.Count); i++)
        {
            var e = cv.Experience[i];
            if (e.Bullets.Count < MinBulletsInRecentRole)
            {
                issues.Add(new(
                    $"{e.Role} at {e.Company} has only {e.Bullets.Count} bullet(s). Recent roles should have 3 to 5.",
                    [new("experience", i, null, $"{e.Role}, {e.Company}")]));
            }
        }

        if (cv.Experience.Count == 0)
        {
            issues.Add(new("There is no work experience on this CV.", []));
        }

        return new("weak-roles", "Weak roles", "Fix the experience that is holding your CV back.",
            cv.Experience.Count == 0 ? 0 : Penalty(issues.Count, 1.5), null, issues);
    }
}
