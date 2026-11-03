using System.Globalization;
using System.Text.RegularExpressions;

namespace backend.jobhunter.Application.CvDrafts;

// Puts a date the AI wrote itself into the CV's one format: "Jan 2022", or "Present" for a current role.
// Anything it does not recognise is left exactly as it was.
public static partial class CvDateText
{
    private static readonly string[] Months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    private static readonly HashSet<string> CurrentWords =
        new(["present", "current", "now", "ongoing", "to date", "today", "till date"], StringComparer.OrdinalIgnoreCase);

    [GeneratedRegex(@"^([A-Za-z]{3,9})\.?,?\s+(\d{4})$")]
    private static partial Regex MonthNameYear();

    [GeneratedRegex(@"^(\d{1,2})[/.](\d{4})$")]
    private static partial Regex MonthSlashYear();

    [GeneratedRegex(@"^(\d{4})[-/](\d{1,2})$")]
    private static partial Regex YearDashMonth();

    public static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return value;

        var text = value.Trim();
        if (CurrentWords.Contains(text)) return "Present";

        if (MonthNameYear().Match(text) is { Success: true } named)
        {
            var month = MonthFromName(named.Groups[1].Value);
            if (month > 0) return Format(month, named.Groups[2].Value);
        }
        if (MonthSlashYear().Match(text) is { Success: true } slash && IsMonth(slash.Groups[1].Value))
        {
            return Format(int.Parse(slash.Groups[1].Value, CultureInfo.InvariantCulture), slash.Groups[2].Value);
        }
        if (YearDashMonth().Match(text) is { Success: true } iso && IsMonth(iso.Groups[2].Value))
        {
            return Format(int.Parse(iso.Groups[2].Value, CultureInfo.InvariantCulture), iso.Groups[1].Value);
        }

        return value;
    }

    private static bool IsMonth(string number)
        => int.TryParse(number, NumberStyles.None, CultureInfo.InvariantCulture, out var n) && n is >= 1 and <= 12;

    private static string Format(int month, string year) => $"{Months[month - 1]} {year}";

    // "January", "Jan", "Sept" and "sep" all start with a three-letter month name.
    private static int MonthFromName(string name)
    {
        var lower = name.ToLowerInvariant();
        var full = new[] { "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december" };
        for (var i = 0; i < 12; i++)
        {
            if (lower == Months[i].ToLowerInvariant() || lower == full[i] || (i == 8 && lower == "sept")) return i + 1;
        }
        return 0;
    }
}
