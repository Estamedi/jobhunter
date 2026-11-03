using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Application.CvDrafts;

// What a CV is written from, apart from the candidate's details and background.
public record CvGenerationInputs(
    string JobTitle,
    string? JobDescription,
    string? Instructions = null,
    string? Tone = null,
    string? Language = null,
    string? LanguageLevel = null);

// The one path from "background and job" to a checked CV. The worker, the live test and the evaluation
// all go through it, so what they measure is what production does.
public static class CvGenerationPipeline
{
    public static CvGenerationRequest BuildRequest(
        string fullName, string? email, string? phone, string? location,
        CvGenerationInputs inputs, CvBackground background, DateOnly today)
        => new()
        {
            FullName = fullName,
            Email = email,
            Phone = phone,
            Location = location,
            JobTitle = inputs.JobTitle,
            JobDescription = inputs.JobDescription,
            Instructions = inputs.Instructions,
            BackgroundText = background.Text,
            Tone = inputs.Tone,
            Language = inputs.Language,
            LanguageLevel = CvLanguageLevel.Normalize(inputs.LanguageLevel),
            TargetPages = CvLengthGuide.TargetPages(background.Profile, today),
        };

    // Generates the CV, then checks it and, when a check fails, asks once more with the exact problems.
    public static async Task<CvDraftImprover.CheckedCv> RunAsync(
        ICvGenerationAiService aiService, CvGenerationRequest request, CvBackground background,
        CancellationToken cancellationToken)
    {
        var generated = await aiService.GenerateAsync(request, cancellationToken);
        return await CvDraftImprover.ImproveAsync(aiService, request, generated, background, cancellationToken);
    }
}
