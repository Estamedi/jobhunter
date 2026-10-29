using backend.jobhunter.Application.Common.Interfaces;
using static backend.jobhunter.Application.CvDrafts.CvScoreText;

namespace backend.jobhunter.Application.CvDrafts;

// The same opening verb on more than two bullets, several near-synonyms of one verb, or the same bullet
// twice, make achievements blend together.
internal sealed class RepetitionCheck : ICvScoreCheck
{
    private const int RepeatLimit = 2;
    private const int FamilyLimit = 4;

    public int Weight => 12;

    public CvScoreCheckDto Run(GeneratedCvDto cv)
    {
        var bullets = Bullets(cv);
        var issues = new List<CvScoreIssueDto>();

        var used = bullets.Select(b => FirstWord(b.Text)).Distinct().ToList();
        var overused = bullets
            .GroupBy(b => FirstWord(b.Text))
            .Where(g => g.Key.Length > 2 && g.Count() > RepeatLimit)
            .ToList();
        foreach (var g in overused)
        {
            var suggestions = ActionVerbs.Suggest(g.Key, used);
            issues.Add(new(
                $"\"{g.Key}\" starts {g.Count()} bullets. Using the same verb more than {RepeatLimit} times makes your achievements blend together."
                + (suggestions.Count > 0 ? $" Try {string.Join(", ", suggestions)}." : ""),
                g.Select(At).ToList()));
        }

        // Near-synonyms (Built, Developed, Created...) count together, once bullets already reported above are
        // set aside. It needs at least two different verbs, otherwise it is the exact-verb case again.
        var flagged = overused.SelectMany(g => g).ToHashSet();
        var byFamily = bullets
            .Where(b => !flagged.Contains(b))
            .Select(b => (Bullet: b, Verb: FirstWord(b.Text), Family: ActionVerbs.FamilyOf(FirstWord(b.Text))))
            .Where(x => x.Family is not null)
            .GroupBy(x => x.Family!);
        foreach (var g in byFamily.Where(g => g.Count() >= FamilyLimit && g.Select(x => x.Verb).Distinct().Count() > 1))
        {
            var verbs = g.GroupBy(x => x.Verb).Select(v => v.Count() > 1 ? $"{v.Key} ×{v.Count()}" : v.Key);
            issues.Add(new(
                $"{g.Count()} bullets open with near-synonyms of one verb ({string.Join(", ", verbs)}). Vary what you say you did.",
                g.Select(x => At(x.Bullet)).ToList()));
        }

        foreach (var g in bullets.GroupBy(b => b.Text.ToLowerInvariant()).Where(g => g.Count() > 1))
        {
            issues.Add(new("The same bullet appears more than once.", g.Select(At).ToList()));
        }

        return new("repetition", "Repetition", "Avoid repeating action verbs and phrases.",
            Penalty(issues.Count, 2), null, issues);
    }
}
