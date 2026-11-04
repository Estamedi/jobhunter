using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Application.CvDrafts;

// Checks a generated CV and, when a writing or grounding check fails, asks the AI once more with the
// exact problems. Each draft carries its own warnings, so only the one the user gets is reported.
public static class CvDraftImprover
{
    private static readonly string[] WritingChecks = ["ai-patterns", "weak-roles", "repetition", "buzzwords"];

    // A checked CV with the warnings that belong to it. Grounding decides between two drafts; the
    // profile-merge warnings only describe how entries were linked.
    public sealed record CheckedCv(
        GeneratedCvDto Cv, List<string> Warnings, int GroundingIssues, int CopiedRuns, int Pronouns, List<string> Problems,
        int KeywordRepeats = 0);

    // Everything the retry should fix is listed in Problems. Only grounding and copied text are also shown
    // to the user as warnings; pronouns are just fixed by the retry.
    public static CheckedCv Check(
        GeneratedCvDto cv, CvBackground background, string? jobDescription, JobRequirementsDto? requirements = null)
    {
        var warnings = new List<string>();
        var merged = CvProfileMerger.Merge(cv, background.Profile, warnings);
        var grounding = CvGroundingValidator.Validate(merged, background.Text);
        var copied = CvJobCopyCheck.FindCopiedRuns(merged, jobDescription, background.Text);
        var pronouns = CvPronounCheck.Find(merged);
        var repeats = CvKeywordRepeatCheck.Find(merged, requirements);

        warnings.AddRange(grounding);
        warnings.AddRange(copied.Select(c => $"A sentence was copied from the job description: \"{c}\"."));

        var problems = grounding.Select(g => $"- Not in the background: {g}")
            .Concat(copied.Select(c => $"- Copied from the job description, write it in your own words: \"{c}\""))
            .Concat(pronouns.Select(p => $"- The summary uses the pronoun \"{p}\"; write it without personal pronouns."))
            .Concat(repeats.Select(r => $"- The keyword \"{r.Keyword}\" is used {r.Count} times; use it at most {CvKeywordRepeatCheck.MaxUses} times and cut or reword the rest."))
            .ToList();
        return new CheckedCv(merged, warnings, grounding.Count, copied.Count, pronouns.Count, problems, repeats.Count);
    }

    public static async Task<CheckedCv> ImproveAsync(
        ICvGenerationAiService aiService, CvGenerationRequest generationRequest, GeneratedCvDto generated,
        CvBackground background, CancellationToken cancellationToken)
    {
        var first = Check(generated, background, generationRequest.JobDescription, generationRequest.Requirements);

        var problems = CvScorer.Score(first.Cv).Checks
            .Where(c => WritingChecks.Contains(c.Id) && c.Score < 10)
            .SelectMany(c => c.Issues.Select(i => $"- {c.Title}: {i.Message} " +
                string.Join(" | ", i.Locations.Take(6).Select(l => $"\"{l.Text}\""))))
            .Concat(first.Problems)
            .ToList();
        if (problems.Count == 0) return first;

        var retry = await aiService.GenerateAsync(generationRequest with
        {
            Instructions = $"{generationRequest.Instructions}\n\nA first draft of this CV failed these checks. Write it again and fix every one. Use only facts from the background: remove or correct anything listed as not in the background, and never add a new figure, employer or school. Do not copy sentences from the job description:\n{string.Join("\n", problems)}",
        }, cancellationToken);
        var second = Check(retry, background, generationRequest.JobDescription, generationRequest.Requirements);

        // Fewer unsupported facts always wins, then fewer copied sentences, then fewer pronouns, then fewer over-used
        // keywords. The writing score only breaks a tie, so a better-written draft can never win by inventing something.
        if (second.GroundingIssues != first.GroundingIssues)
        {
            return second.GroundingIssues < first.GroundingIssues ? second : first;
        }
        if (second.CopiedRuns != first.CopiedRuns)
        {
            return second.CopiedRuns < first.CopiedRuns ? second : first;
        }
        if (second.Pronouns != first.Pronouns)
        {
            return second.Pronouns < first.Pronouns ? second : first;
        }
        if (second.KeywordRepeats != first.KeywordRepeats)
        {
            return second.KeywordRepeats < first.KeywordRepeats ? second : first;
        }
        return CvScorer.Score(second.Cv).Overall > CvScorer.Score(first.Cv).Overall ? second : first;
    }
}
