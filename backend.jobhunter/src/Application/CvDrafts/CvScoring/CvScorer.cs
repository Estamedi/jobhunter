using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Application.CvDrafts;

// Scores a CV with fixed rules, so the same CV always gets the same score, it costs nothing to re-run
// after every edit, and every point lost can be traced to a line. Each check is 0 to 10 and lives in its
// own file; the overall score is their weighted average out of 100.
public static class CvScorer
{
    private static readonly ICvScoreCheck[] Checks =
    [
        new QuantifyImpactCheck(),
        new WeakRolesCheck(),
        new DatesCheck(),
        new RepetitionCheck(),
        new ReadabilityCheck(),
        new BuzzwordsCheck(),
        new SkillsCheck(),
        new TenseCheck(),
    ];

    // Every check's share of the score; they must add up to 100 or the overall score is off.
    public static int TotalWeight => Checks.Sum(c => c.Weight);

    public static CvScoreDto Score(GeneratedCvDto cv)
    {
        var results = Checks.Select(c => (Result: c.Run(cv), c.Weight)).ToList();
        var overall = (int)Math.Round(
            results.Sum(r => r.Result.Score * r.Weight) / 10.0, MidpointRounding.AwayFromZero);
        return new CvScoreDto(overall, results.Select(r => r.Result).ToList());
    }
}
