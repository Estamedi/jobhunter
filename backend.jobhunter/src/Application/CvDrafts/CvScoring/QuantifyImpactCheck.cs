using System.Text.RegularExpressions;
using backend.jobhunter.Application.Common.Interfaces;
using static backend.jobhunter.Application.CvDrafts.CvScoreText;

namespace backend.jobhunter.Application.CvDrafts;

// Bullets with a number, percentage or amount show a result. 60% of them quantified scores full marks.
internal sealed partial class QuantifyImpactCheck : ICvScoreCheck
{
    private const double QuantifiedTarget = 0.6;

    public int Weight => 22;

    public CvScoreCheckDto Run(GeneratedCvDto cv)
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

    [GeneratedRegex(@"\d")]
    private static partial Regex NumberPattern();
}
