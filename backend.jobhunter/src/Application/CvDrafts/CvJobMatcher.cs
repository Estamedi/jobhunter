using System.Text.Json.Serialization;
using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Application.CvDrafts;

// Sent to the UI by name ("InCv", "Missing", ...), not as a number.
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RequirementStatus
{
    // Found in the headline, summary, experience or projects, where ATS and recruiters weigh it most.
    InCv,
    // Found only in the skills list.
    SkillsOnly,
    // On the candidate's profile but not written into this CV.
    InProfile,
    // Nowhere in the CV or the profile.
    Missing,
}

public record RequirementMatch(string Name, bool MustHave, RequirementStatus Status);

public record CvJobMatchDto(
    bool HasJobDescription,
    IReadOnlyList<RequirementMatch> Requirements,
    IReadOnlyList<string> OtherRequirements,
    int MustHaveCovered,
    int MustHaveTotal);

// Checks a CV against the skills a job asks for. Plain text matching, no AI, so it is instant and the
// same input always gives the same answer.
public static class CvJobMatcher
{
    public static CvJobMatchDto Match(JobRequirementsDto requirements, GeneratedCvDto cv, string? profileText)
    {
        var context = Strip(string.Join('\n', ContextParts(cv)));
        var skills = Strip(string.Join('\n', cv.Skills.SelectMany(g => g.Items.Prepend(g.Category))));
        var profile = Strip(profileText ?? string.Empty);

        var results = new List<RequirementMatch>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        void Add(IEnumerable<JobRequirementDto> list, bool mustHave)
        {
            foreach (var requirement in list)
            {
                var name = requirement.Name.Trim();
                if (name.Length == 0 || !seen.Add(name)) continue;

                var terms = requirement.Aliases.Prepend(name)
                    .Select(t => t.Trim()).Where(t => t.Length > 0).ToList();
                var status =
                    terms.Any(t => ContainsTerm(context, t)) ? RequirementStatus.InCv :
                    terms.Any(t => ContainsTerm(skills, t)) ? RequirementStatus.SkillsOnly :
                    terms.Any(t => ContainsTerm(profile, t)) ? RequirementStatus.InProfile :
                    RequirementStatus.Missing;
                results.Add(new RequirementMatch(name, mustHave, status));
            }
        }

        Add(requirements.MustHave, true);
        Add(requirements.NiceToHave, false);

        var must = results.Where(r => r.MustHave).ToList();
        var covered = must.Count(r => r.Status is RequirementStatus.InCv or RequirementStatus.SkillsOnly);
        return new CvJobMatchDto(true, results, requirements.OtherRequirements, covered, must.Count);
    }

    private static IEnumerable<string> ContextParts(GeneratedCvDto cv)
    {
        yield return cv.Headline;
        yield return cv.Summary;
        foreach (var job in cv.Experience)
        {
            yield return job.Role;
            foreach (var bullet in job.Bullets) yield return bullet;
        }
        foreach (var project in cv.Projects)
        {
            yield return project.Name;
            yield return project.Description ?? string.Empty;
        }
        foreach (var cert in cv.Certifications) yield return cert;
    }

    private static string Strip(string text) => text.Replace("**", string.Empty);

    // A whole-term, case-insensitive match. The characters on either side must not be letters or digits,
    // so "Go" does not match inside "Google", while terms such as "C#", ".NET" and "C++" still match.
    public static bool ContainsTerm(string text, string term)
    {
        if (term.Length == 0) return false;

        var index = 0;
        while ((index = text.IndexOf(term, index, StringComparison.OrdinalIgnoreCase)) >= 0)
        {
            var before = index == 0 || !char.IsLetterOrDigit(text[index - 1]);
            var end = index + term.Length;
            var after = end >= text.Length || !char.IsLetterOrDigit(text[end]);
            if (before && after) return true;
            index++;
        }
        return false;
    }
}
