using backend.jobhunter.Application.Common.Interfaces;
using static backend.jobhunter.Application.CvDrafts.CvScoreText;

namespace backend.jobhunter.Application.CvDrafts;

// The same opening verb on more than two bullets, or the same bullet twice, makes achievements blend together.
internal sealed class RepetitionCheck : ICvScoreCheck
{
    private const int RepeatLimit = 2;

    public int Weight => 10;

    public CvScoreCheckDto Run(GeneratedCvDto cv)
    {
        var bullets = Bullets(cv);
        var issues = new List<CvScoreIssueDto>();

        var overused = bullets
            .GroupBy(b => FirstWord(b.Text))
            .Where(g => g.Key.Length > 2 && g.Count() > RepeatLimit);
        foreach (var g in overused)
        {
            issues.Add(new(
                $"\"{g.Key}\" starts {g.Count()} bullets. Using the same verb more than {RepeatLimit} times makes your achievements blend together.",
                g.Select(At).ToList()));
        }

        foreach (var g in bullets.GroupBy(b => b.Text.ToLowerInvariant()).Where(g => g.Count() > 1))
        {
            issues.Add(new("The same bullet appears more than once.", g.Select(At).ToList()));
        }

        return new("repetition", "Repetition", "Avoid repeating action verbs and phrases.",
            Penalty(issues.Count, 2), null, issues);
    }
}
