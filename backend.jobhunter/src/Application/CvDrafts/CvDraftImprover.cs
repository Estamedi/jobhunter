using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Application.CvDrafts;

// Checks a generated CV and, when a writing or grounding check fails, asks the AI once more with the
// exact problems. Each draft carries its own warnings, so only the one the user gets is reported.
public static class CvDraftImprover
{
    private static readonly string[] WritingChecks = ["ai-patterns", "weak-roles", "repetition", "buzzwords"];

    // A checked CV with the warnings that belong to it. Grounding decides between two drafts; the
    // profile-merge warnings only describe how entries were linked.
    public sealed record CheckedCv(GeneratedCvDto Cv, List<string> Warnings, int GroundingIssues);

    public static CheckedCv Check(GeneratedCvDto cv, CvBackground background, out List<string> grounding)
    {
        var warnings = new List<string>();
        var merged = CvProfileMerger.Merge(cv, background.Profile, warnings);
        grounding = CvGroundingValidator.Validate(merged, background.Text);
        warnings.AddRange(grounding);
        return new CheckedCv(merged, warnings, grounding.Count);
    }

    public static async Task<CheckedCv> ImproveAsync(
        ICvGenerationAiService aiService, CvGenerationRequest generationRequest, GeneratedCvDto generated,
        CvBackground background, CancellationToken cancellationToken)
    {
        var first = Check(generated, background, out var groundingProblems);

        var problems = CvScorer.Score(first.Cv).Checks
            .Where(c => WritingChecks.Contains(c.Id) && c.Score < 10)
            .SelectMany(c => c.Issues.Select(i => $"- {c.Title}: {i.Message} " +
                string.Join(" | ", i.Locations.Take(6).Select(l => $"\"{l.Text}\""))))
            .Concat(groundingProblems.Select(g => $"- Not in the background: {g}"))
            .ToList();
        if (problems.Count == 0) return first;

        var retry = await aiService.GenerateAsync(generationRequest with
        {
            Instructions = $"{generationRequest.Instructions}\n\nA first draft of this CV failed these checks. Write it again and fix every one. Use only facts from the background: remove or correct anything listed as not in the background, and never add a new figure, employer or school:\n{string.Join("\n", problems)}",
        }, cancellationToken);
        var second = Check(retry, background, out _);

        // Fewer unsupported facts always wins. The writing score only breaks a tie, so a better-written
        // draft can never win by inventing something.
        if (second.GroundingIssues != first.GroundingIssues)
        {
            return second.GroundingIssues < first.GroundingIssues ? second : first;
        }
        return CvScorer.Score(second.Cv).Overall > CvScorer.Score(first.Cv).Overall ? second : first;
    }
}
