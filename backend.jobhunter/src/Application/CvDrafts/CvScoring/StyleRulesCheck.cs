using System.Text.RegularExpressions;
using backend.jobhunter.Application.Common.Interfaces;
using static backend.jobhunter.Application.CvDrafts.CvScoreText;

namespace backend.jobhunter.Application.CvDrafts;

// Writing conventions from resume-builder-skill: numbers as digits, no obvious skills, no skill ratings.
internal sealed partial class StyleRulesCheck : ICvScoreCheck
{
    private static readonly string[] ObviousSkills =
    [
        "microsoft office", "ms office", "office suite", "microsoft word", "email", "e-mail", "internet",
        "computer literate",
    ];

    // "one" is left out on purpose: it is usually a pronoun, not a count.
    [GeneratedRegex(@"\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred)\b|\bpercent\b",
        RegexOptions.IgnoreCase)]
    private static partial Regex SpelledNumber();

    // 8/10, 90%, stars, or a level in brackets.
    [GeneratedRegex(@"\d+\s*/\s*\d+|\d+\s*%|[★☆]|\b(stars?|out of)\b|\(\s*(expert|advanced|intermediate|beginner|basic|proficient)\s*\)",
        RegexOptions.IgnoreCase)]
    private static partial Regex SkillRating();

    public int Weight => 5;

    public CvScoreCheckDto Run(GeneratedCvDto cv)
    {
        var issues = new List<CvScoreIssueDto>();
        var summary = Clean(cv.Summary);
        var texts = new List<(CvScoreLocationDto Where, string Text)> { (new("summary", null, null, summary), summary) };
        texts.AddRange(Bullets(cv).Select(b => (At(b), b.Text)));

        if (texts.Count == 1 && summary.Length == 0 && cv.Skills.Count == 0)
        {
            return new("style-rules", "Style rules", "Digits for numbers, no obvious skills, no skill ratings.",
                0, "Nothing to check yet", issues);
        }

        foreach (var (where, text) in texts)
        {
            var match = SpelledNumber().Match(text);
            if (match.Success)
            {
                issues.Add(new($"\"{match.Value}\" is spelled out. Use digits instead (8, 30%).", [where]));
            }
        }

        foreach (var item in cv.Skills.SelectMany(g => g.Items).Select(Clean).Where(i => i.Length > 0))
        {
            var where = new CvScoreLocationDto("skills", null, null, item);
            var lower = item.ToLowerInvariant();
            if (ObviousSkills.Any(o => lower.Contains(o)))
            {
                issues.Add(new($"\"{item}\" is assumed for any candidate. Remove it.", [where]));
            }
            else if (SkillRating().IsMatch(item))
            {
                issues.Add(new($"\"{item}\" rates a skill. Ratings are subjective; list the skill alone.", [where]));
            }
        }

        return new("style-rules", "Style rules", "Digits for numbers, no obvious skills, no skill ratings.",
            Penalty(issues.Count, 2), null, issues);
    }
}
