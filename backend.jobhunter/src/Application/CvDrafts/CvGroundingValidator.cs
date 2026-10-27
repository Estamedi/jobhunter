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

    private static bool Mentions(string source, string value)
        => string.IsNullOrWhiteSpace(value) || source.Contains(value.Trim(), StringComparison.OrdinalIgnoreCase);
}
