using System.Globalization;
using System.Text.RegularExpressions;
using backend.jobhunter.Application.Common.Interfaces;
using static backend.jobhunter.Application.CvDrafts.CvScoreText;

namespace backend.jobhunter.Application.CvDrafts;

// Reads each role's start and end text. Flags a missing or unreadable start, an end before the start, gaps
// over six months between roles, and mixed date formats. Overlapping roles are fine. It never checks that
// the dates are true.
internal sealed partial class DatesCheck : ICvScoreCheck
{
    private const int MaxGapMonths = 6;

    public int Weight => 15;

    public CvScoreCheckDto Run(GeneratedCvDto cv)
    {
        var issues = new List<CvScoreIssueDto>();
        var parsed = new List<(int Index, DateTime Start, DateTime End)>();

        for (var i = 0; i < cv.Experience.Count; i++)
        {
            var e = cv.Experience[i];
            var where = new CvScoreLocationDto("experience", i, null, $"{e.Role}, {e.Company}");
            var start = ParseDate(e.StartDate, false);
            var end = ParseDate(e.EndDate, true);

            if (string.IsNullOrWhiteSpace(e.StartDate) || start is null)
            {
                issues.Add(new($"{e.Role} at {e.Company} has no readable start date.", [where]));
                continue;
            }
            if (end is not null && end < start)
            {
                issues.Add(new($"{e.Role} at {e.Company} ends before it starts.", [where]));
                continue;
            }
            parsed.Add((i, start.Value, end ?? DateTime.UtcNow));
        }

        var ordered = parsed.OrderByDescending(p => p.Start).ToList();
        for (var i = 0; i + 1 < ordered.Count; i++)
        {
            var gapMonths = (ordered[i].Start.Year - ordered[i + 1].End.Year) * 12
                + ordered[i].Start.Month - ordered[i + 1].End.Month;
            if (gapMonths > MaxGapMonths)
            {
                var next = cv.Experience[ordered[i].Index];
                issues.Add(new($"A gap of about {gapMonths} months before {next.Role} at {next.Company}.",
                    [new("experience", ordered[i].Index, null, $"{next.Role}, {next.Company}")]));
            }
        }

        var styles = cv.Experience
            .SelectMany(e => new[] { e.StartDate, e.EndDate })
            .Where(d => !string.IsNullOrWhiteSpace(d) && !d!.Trim().Equals("present", StringComparison.OrdinalIgnoreCase))
            .Select(DateStyle).Distinct().Count();
        if (styles > 1)
        {
            issues.Add(new("Dates are written in different formats. Use one, such as \"Jan 2025\".", []));
        }

        return new("dates", "Dates", "Clear, consistent dates with no unexplained gaps.",
            Penalty(issues.Count, 2), null, issues);
    }

    private static string DateStyle(string? d)
    {
        var s = d!.Trim();
        if (YearOnlyPattern().IsMatch(s)) return "year";
        if (NumericDatePattern().IsMatch(s)) return "numeric";
        return "text";
    }

    private static DateTime? ParseDate(string? value, bool isEnd)
    {
        var s = value?.Trim();
        if (string.IsNullOrEmpty(s)) return isEnd ? DateTime.UtcNow : null;
        if (s.Equals("present", StringComparison.OrdinalIgnoreCase) || s.Equals("current", StringComparison.OrdinalIgnoreCase))
        {
            return DateTime.UtcNow;
        }
        if (DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var d))
        {
            return d;
        }
        return YearOnlyPattern().IsMatch(s) ? new DateTime(int.Parse(s), isEnd ? 12 : 1, 1) : null;
    }

    [GeneratedRegex(@"^\d{4}$")]
    private static partial Regex YearOnlyPattern();

    [GeneratedRegex(@"^\d{1,2}[/.-]\d{1,4}")]
    private static partial Regex NumericDatePattern();
}
