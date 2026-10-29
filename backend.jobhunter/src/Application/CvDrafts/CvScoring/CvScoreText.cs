using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Application.CvDrafts;

// Small helpers the checks share.
internal static class CvScoreText
{
    internal record Bullet(int Entry, int Index, string Text);

    public static string Clean(string? s) => (s ?? string.Empty).Replace("**", "").Trim();

    public static int Words(string s) => s.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;

    public static string FirstWord(string text)
        => (text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? string.Empty)
            .Trim('.', ',', ';', ':', '-', '•').ToLowerInvariant();

    public static List<Bullet> Bullets(GeneratedCvDto cv)
        => cv.Experience
            .SelectMany((e, ei) => e.Bullets.Select((b, bi) => new Bullet(ei, bi, Clean(b))))
            .Where(b => b.Text.Length > 0)
            .ToList();

    public static CvScoreLocationDto At(Bullet b) => new("experience", b.Entry, b.Index, b.Text);

    // Each problem costs `perIssue` points, down to 0.
    public static int Penalty(int problems, double perIssue)
        => Math.Max(0, (int)Math.Round(10 - problems * perIssue, MidpointRounding.AwayFromZero));
}
