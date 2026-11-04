using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Application.CvDrafts;

// A job keyword said again and again reads as stuffing and is penalised by recruiters and some ATS. The
// prompt caps it at 6 uses; this finds the keywords that still pass the cap. The keywords are the skills
// the job description extraction found, so no second list is kept. Only the text the writer chooses is
// counted (summary, bullets, project descriptions). Skills, headline and role names are not: a keyword
// there is normal, and role names come from the profile, so repeating it could not be fixed.
public static class CvKeywordRepeatCheck
{
    public const int MaxUses = 6;

    public record Repeat(string Keyword, int Count);

    private static string WrittenText(GeneratedCvDto cv)
        => string.Join('\n', cv.Experience.SelectMany(e => e.Bullets)
            .Prepend(cv.Summary)
            .Concat(cv.Projects.Select(p => p.Description ?? string.Empty))).Replace("**", string.Empty);

    public static List<Repeat> Find(GeneratedCvDto cv, JobRequirementsDto? requirements, int max = MaxUses)
    {
        if (requirements is null) return [];

        var text = WrittenText(cv);
        var found = new List<Repeat>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var requirement in requirements.MustHave.Concat(requirements.NiceToHave))
        {
            var name = requirement.Name.Trim();
            if (name.Length == 0 || !seen.Add(name)) continue;

            // The most-used spelling decides, so "Kubernetes" and "K8s" are not added together.
            var count = requirement.Aliases.Prepend(name)
                .Select(t => t.Trim())
                .Where(t => t.Length > 0)
                .Select(t => CvJobMatcher.CountTerm(text, t))
                .DefaultIfEmpty(0)
                .Max();
            if (count > max) found.Add(new Repeat(name, count));
        }
        return found;
    }
}
