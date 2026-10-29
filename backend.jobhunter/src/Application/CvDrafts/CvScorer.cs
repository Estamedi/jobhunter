using System.Globalization;
using System.Text.RegularExpressions;
using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Application.CvDrafts;

// Where an issue is, so the screen can point at the exact line. Bullet and entry indexes are zero-based;
// Section matches the CV sections ("summary", "experience", "skills", ...).
public record CvScoreLocationDto(string Section, int? EntryIndex, int? BulletIndex, string Text);

public record CvScoreIssueDto(string Message, IReadOnlyList<CvScoreLocationDto> Locations);

public record CvScoreCheckDto(
    string Id, string Title, string Description, int Score, string? Detail, IReadOnlyList<CvScoreIssueDto> Issues);

public record CvScoreDto(int Overall, IReadOnlyList<CvScoreCheckDto> Checks);

// Scores a CV with fixed rules, so the same CV always gets the same score, it costs nothing to re-run
// after every edit, and every point lost can be traced to a line. Each check is 0 to 10; the overall
// score is their weighted average out of 100.
public static partial class CvScorer
{
    private const int MaxBulletWords = 30;
    private const int MinBulletWords = 6;
    private const int MaxSummaryWords = 90;
    private const int RepeatLimit = 2;
    private const double QuantifiedTarget = 0.6;
    private const int MinSkills = 8;

    private static readonly string[] WeakOpeners =
    [
        "responsible for", "helped", "worked on", "assisted", "involved in", "duties included", "tasked with",
        "participated in", "was part of",
    ];

    private static readonly string[] Buzzwords =
    [
        "team player", "hard-working", "hardworking", "results-driven", "results-oriented", "go-getter",
        "self-starter", "detail-oriented", "think outside the box", "synergy", "dynamic", "passionate",
        "motivated", "people person", "fast learner", "strong work ethic",
    ];

    public static CvScoreDto Score(GeneratedCvDto cv)
    {
        var checks = new List<(CvScoreCheckDto Check, int Weight)>
        {
            (Quantify(cv), 25),
            (WeakRoles(cv), 20),
            (Repetition(cv), 10),
            (Readability(cv), 10),
            (BuzzwordCheck(cv), 10),
            (Dates(cv), 15),
            (SkillsCheck(cv), 10),
        };

        var overall = (int)Math.Round(checks.Sum(c => c.Check.Score * c.Weight) / 10.0, MidpointRounding.AwayFromZero);
        return new CvScoreDto(overall, checks.Select(c => c.Check).ToList());
    }

    private record Bullet(int Entry, int Index, string Text);

    private static List<Bullet> Bullets(GeneratedCvDto cv)
        => cv.Experience
            .SelectMany((e, ei) => e.Bullets.Select((b, bi) => new Bullet(ei, bi, Clean(b))))
            .Where(b => b.Text.Length > 0)
            .ToList();

    private static string Clean(string? s) => (s ?? string.Empty).Replace("**", "").Trim();

    private static int Words(string s) => s.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;

    private static CvScoreLocationDto At(Bullet b) => new("experience", b.Entry, b.Index, b.Text);

    // Each problem costs `perIssue` points, down to 0.
    private static int Penalty(int problems, double perIssue)
        => Math.Max(0, (int)Math.Round(10 - problems * perIssue, MidpointRounding.AwayFromZero));

    private static CvScoreCheckDto Quantify(GeneratedCvDto cv)
    {
        var bullets = Bullets(cv);
        var plain = bullets.Where(b => !NumberPattern().IsMatch(b.Text)).ToList();
        var counted = bullets.Count - plain.Count;
        var ratio = bullets.Count == 0 ? 0 : (double)counted / bullets.Count;
        var score = bullets.Count == 0 ? 0 : (int)Math.Min(10, Math.Round(ratio / QuantifiedTarget * 10));

        var issues = plain.Count > 0 && score < 10
            ? [new CvScoreIssueDto(
                $"{plain.Count} bullets have no number, percentage or amount. Add a real figure from your work where you have one.",
                plain.Select(At).ToList())]
            : new List<CvScoreIssueDto>();

        return new("quantify", "Quantify impact", "Use numbers and metrics in your bullet points.", score,
            $"{counted} of {bullets.Count} bullets quantified", issues);
    }

    private static CvScoreCheckDto WeakRoles(GeneratedCvDto cv)
    {
        var issues = new List<CvScoreIssueDto>();

        foreach (var b in Bullets(cv))
        {
            var lower = b.Text.ToLowerInvariant();
            var opener = WeakOpeners.FirstOrDefault(w => lower.StartsWith(w));
            if (opener is not null)
            {
                issues.Add(new($"Starts with \"{opener}\". Open with what you did and the result.", [At(b)]));
            }
            else if (Words(b.Text) < MinBulletWords)
            {
                issues.Add(new("Too short to show what you achieved.", [At(b)]));
            }
        }

        // The two most recent roles carry the most weight, so a thin one stands out.
        for (var i = 0; i < Math.Min(2, cv.Experience.Count); i++)
        {
            var e = cv.Experience[i];
            if (e.Bullets.Count < 3)
            {
                issues.Add(new(
                    $"{e.Role} at {e.Company} has only {e.Bullets.Count} bullet(s). Recent roles should have 3 to 5.",
                    [new("experience", i, null, $"{e.Role}, {e.Company}")]));
            }
        }

        if (cv.Experience.Count == 0)
        {
            issues.Add(new("There is no work experience on this CV.", []));
        }

        return new("weak-roles", "Weak roles", "Fix the experience that is holding your CV back.",
            cv.Experience.Count == 0 ? 0 : Penalty(issues.Count, 1.5), null, issues);
    }

    private static CvScoreCheckDto Repetition(GeneratedCvDto cv)
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

    private static string FirstWord(string text)
        => (text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? string.Empty)
            .Trim('.', ',', ';', ':', '-', '•').ToLowerInvariant();

    private static CvScoreCheckDto Readability(GeneratedCvDto cv)
    {
        var issues = new List<CvScoreIssueDto>();

        foreach (var b in Bullets(cv).Where(b => Words(b.Text) > MaxBulletWords))
        {
            issues.Add(new($"{Words(b.Text)} words. Keep bullets under {MaxBulletWords}.", [At(b)]));
        }

        var summary = Clean(cv.Summary);
        if (summary.Length == 0)
        {
            issues.Add(new("There is no summary.", []));
        }
        else if (Words(summary) > MaxSummaryWords)
        {
            issues.Add(new($"The summary is {Words(summary)} words. Keep it under {MaxSummaryWords}.",
                [new("summary", null, null, summary)]));
        }

        if (Clean(cv.Headline).Length > 70)
        {
            issues.Add(new("The headline is too long. Keep it on one short line.",
                [new("headline", null, null, Clean(cv.Headline))]));
        }

        return new("readability", "Readability", "Keep it short enough to skim in seconds.",
            Penalty(issues.Count, 2), null, issues);
    }

    private static CvScoreCheckDto BuzzwordCheck(GeneratedCvDto cv)
    {
        var issues = new List<CvScoreIssueDto>();
        var texts = new List<(CvScoreLocationDto Where, string Text)> { (new("summary", null, null, Clean(cv.Summary)), Clean(cv.Summary)) };
        texts.AddRange(Bullets(cv).Select(b => (At(b), b.Text)));

        foreach (var (where, text) in texts)
        {
            var lower = text.ToLowerInvariant();
            foreach (var word in Buzzwords.Where(w => lower.Contains(w)))
            {
                issues.Add(new($"\"{word}\" is a cliché recruiters skip. Show it with a result instead.", [where]));
            }
        }

        return new("buzzwords", "Buzzwords", "Replace empty phrases with proof.",
            Penalty(issues.Count, 2.5), null, issues);
    }

    private static CvScoreCheckDto Dates(GeneratedCvDto cv)
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
            var gapMonths = (ordered[i].Start.Year - ordered[i + 1].End.Year) * 12 + ordered[i].Start.Month - ordered[i + 1].End.Month;
            if (gapMonths > 6)
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

    private static CvScoreCheckDto SkillsCheck(GeneratedCvDto cv)
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

    [GeneratedRegex(@"\d")]
    private static partial Regex NumberPattern();

    [GeneratedRegex(@"^\d{4}$")]
    private static partial Regex YearOnlyPattern();

    [GeneratedRegex(@"^\d{1,2}[/.-]\d{1,4}")]
    private static partial Regex NumericDatePattern();
}
