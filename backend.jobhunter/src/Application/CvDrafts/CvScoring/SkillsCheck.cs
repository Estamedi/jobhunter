using backend.jobhunter.Application.Common.Interfaces;
using static backend.jobhunter.Application.CvDrafts.CvScoreText;

namespace backend.jobhunter.Application.CvDrafts;

// How many skills are listed and whether any repeat. Whether they match a job is CvJobMatcher's work.
internal sealed class SkillsCheck : ICvScoreCheck
{
    private const int MinSkills = 8;

    public int Weight => 10;

    public CvScoreCheckDto Run(GeneratedCvDto cv)
    {
        var issues = new List<CvScoreIssueDto>();
        var items = cv.Skills.SelectMany(g => g.Items).Select(Clean).Where(i => i.Length > 0).ToList();

        if (items.Count < MinSkills)
        {
            issues.Add(new($"Only {items.Count} skills listed. Aim for at least {MinSkills} that you really have.", []));
        }

        var duplicates = items.GroupBy(i => i.ToLowerInvariant()).Where(g => g.Count() > 1).Select(g => g.First()).ToList();
        if (duplicates.Count > 0)
        {
            issues.Add(new($"Listed more than once: {string.Join(", ", duplicates)}.",
                duplicates.Select(d => new CvScoreLocationDto("skills", null, null, d)).ToList()));
        }

        return new("skills", "Skills section", "A focused list of skills you really have.",
            Penalty(issues.Count, 3), $"{items.Count} skills", issues);
    }
}
