using System.Text.RegularExpressions;
using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Application.CvDrafts;

// Cheap safety net after generation: flags employers, schools, certifications and figures that do not
// appear anywhere in the background the AI was given. It only reports; the user decides what to do.
public static partial class CvGroundingValidator
{
    // Numbers like "30%", "12,000" or "3.5" or "2024". A lone digit ("3 teams") is too often spelled
    // differently in the source to flag reliably.
    [GeneratedRegex(@"\d+(?:[.,]\d+)*%?")]
    private static partial Regex NumberPattern();

    public static List<string> Validate(GeneratedCvDto cv, string? background)
    {
        var warnings = new List<string>();
        var source = background ?? string.Empty;

        foreach (var job in cv.Experience)
        {
            if (!Mentions(source, job.Company))
            {
                warnings.Add($"The employer \"{job.Company}\" was not found in your background.");
            }
        }

        foreach (var edu in cv.Education)
        {
            if (!Mentions(source, edu.Institution))
            {
                warnings.Add($"The school \"{edu.Institution}\" was not found in your background.");
            }
        }

        foreach (var cert in cv.Certifications)
        {
            // "AZ-204 (Microsoft, 2023)" is fine when the background holds "AZ-204".
            if (!Mentions(source, cert.Split('(', ',')[0]))
            {
                warnings.Add($"The certification \"{cert}\" was not found in your background.");
            }
        }

        foreach (var skill in cv.Skills.SelectMany(g => g.Items)
                     .Select(i => i.Replace("**", string.Empty).Trim())
                     .Where(i => i.Length > 0)
                     .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (!SkillSupported(source, skill))
            {
                warnings.Add($"The skill \"{skill}\" was not found in your background.");
            }
        }

        var texts = new List<string> { cv.Summary };
        texts.AddRange(cv.Experience.SelectMany(j => j.Bullets));
        var unknownNumbers = texts
            .SelectMany(t => NumberPattern().Matches(t).Select(m => m.Value))
            .Where(n => n.Length > 1 && !source.Contains(n, StringComparison.OrdinalIgnoreCase))
            .Distinct()
            .ToList();
        foreach (var number in unknownNumbers)
        {
            warnings.Add($"The figure \"{number}\" does not appear in your background; check it is accurate.");
        }

        return warnings;
    }

    private static readonly HashSet<string> SkillStopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "and", "the", "with", "for", "of", "in", "on", "to", "a", "an", "tools", "tool", "services", "service",
        "systems", "system", "development", "management", "practices", "skills",
    };

    // A skill is backed up when the whole item, or any meaningful word in it, appears in the background.
    // The word rule lets rewordings such as "VPS infrastructure" pass, while an invented technology such
    // as "Kubernetes" has no word that appears anywhere and is flagged. Two more cases are accepted: the
    // initials of a multi-word skill ("Entity Framework" for "EF"), and the bare letter of a language
    // such as "C#" or "C++", because a "#" or "+" is often lost when text is copied out of a PDF.
    private static bool SkillSupported(string source, string skill)
    {
        source = StripInvisible(source);
        skill = StripInvisible(skill);
        // A whole-term match, so "Java" is not backed up by "JavaScript" or "Go" by "Google".
        if (CvJobMatcher.ContainsTerm(source, skill)) return true;

        var words = skill.Split([' ', ',', '/', '(', ')', '&', ';', ':'], StringSplitOptions.RemoveEmptyEntries)
            .Select(w => w.Trim('-', '.', '"', '\'', '*'))
            .Where(w => w.Length >= 2 && !SkillStopWords.Contains(w))
            .ToList();
        if (words.Any(w => CvJobMatcher.ContainsTerm(source, w))) return true;

        var meaningful = skill.Split([' ', '-', '/'], StringSplitOptions.RemoveEmptyEntries)
            .Where(w => !SkillStopWords.Contains(w)).ToList();
        if (meaningful.Count >= 2)
        {
            var initials = new string(meaningful.Select(w => char.ToUpperInvariant(w[0])).ToArray());
            if (CvJobMatcher.ContainsTerm(source.ToUpperInvariant(), initials)) return true;
        }

        var bare = skill.TrimEnd('#', '+');
        return bare.Length > 0 && bare.Length < skill.Length && CvJobMatcher.ContainsTerm(source, bare);
    }

    // Emoji selectors and zero-width characters that PDF text extraction leaves behind.
    private static string StripInvisible(string text)
        => text.Replace("\uFE0F", string.Empty).Replace("\u200B", string.Empty).Replace("\u200C", string.Empty).Replace("\u200D", string.Empty);

    private static bool Mentions(string source, string value)
        => string.IsNullOrWhiteSpace(value) || source.Contains(value.Trim(), StringComparison.OrdinalIgnoreCase);
}
