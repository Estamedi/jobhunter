using System.Text.Json;
using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.CvDrafts;

// Writes the content of a Pending draft with the AI. Run by the background worker, never inside a web
// request, because one generation takes about a minute and a retry doubles it.
public class CvDraftGenerationService(
    IApplicationDbContext context, ICvGenerationAiService aiService, IFileStorage fileStorage, ICvTextExtractor textExtractor)
{
    public async Task RunAsync(int draftId, CancellationToken cancellationToken)
    {
        var draft = await context.CvDrafts.FirstOrDefaultAsync(d => d.Id == draftId, cancellationToken)
            ?? throw new NotFoundException(nameof(CvDraft), draftId);

        var candidate = await context.Candidates.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == draft.CandidateId, cancellationToken)
            ?? throw new NotFoundException(nameof(Candidate), draft.CandidateId);

        // Warnings found when the request was accepted (no job description, text too long) come first.
        var warnings = string.IsNullOrWhiteSpace(draft.GenerationWarningsJson)
            ? []
            : JsonSerializer.Deserialize<List<string>>(draft.GenerationWarningsJson) ?? [];

        var sourceCv = draft.SourceCvId.HasValue
            ? await context.Cvs.AsNoTracking().FirstOrDefaultAsync(c => c.Id == draft.SourceCvId, cancellationToken)
            : null;
        var sourceCvText = await CvSourceText.ReadAsync(sourceCv, fileStorage, textExtractor, warnings, cancellationToken);
        var background = await CvBackgroundBuilder.BuildAsync(
            context, draft.CandidateId, draft.GenerationNotes, sourceCvText, cancellationToken);
        warnings.AddRange(background.Warnings);

        var requirements = await ReadRequirementsAsync(draft, cancellationToken);

        var generationRequest = CvGenerationPipeline.BuildRequest(
            candidate.FullName, candidate.Email, candidate.Phone, candidate.CurrentLocation,
            new CvGenerationInputs(
                draft.JobTitle, draft.JobDescription, draft.Instructions, draft.Tone, draft.Language, draft.LanguageLevel,
                requirements),
            background, DateOnly.FromDateTime(DateTime.UtcNow));

        // The prompt asks for clean, grounded writing, but the model still slips (vague "-ing" endings,
        // weak verbs, an employer or figure that is not in the background). The pipeline checks the first
        // draft and, when a check fails, asks once more with the exact problems.
        var chosen = await CvGenerationPipeline.RunAsync(aiService, generationRequest, background, cancellationToken);
        warnings.AddRange(chosen.Warnings);

        draft.ContentJson = CvDraftContent.Serialize(chosen.Cv);
        draft.GenerationWarningsJson = JsonSerializer.Serialize(warnings);
        draft.GenerationError = null;
        draft.Status = CvDraftStatus.Completed;
        await context.SaveChangesAsync(cancellationToken);
    }

    // The skills the job asks for, read once and kept on the draft, so the match report reuses them. Without
    // them the CV is still written, just without the extra hint, so a failure here never fails the draft.
    private async Task<JobRequirementsDto?> ReadRequirementsAsync(CvDraft draft, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(draft.JobDescription)) return null;

        var json = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        if (!string.IsNullOrWhiteSpace(draft.JobRequirementsJson))
        {
            return JsonSerializer.Deserialize<JobRequirementsDto>(draft.JobRequirementsJson, json);
        }

        var requirements = await CvGenerationPipeline.ReadRequirementsAsync(aiService, draft.JobDescription, cancellationToken);
        if (requirements is null) return null;

        draft.JobRequirementsJson = JsonSerializer.Serialize(requirements, json);
        // Saved now, so a retry after a failed writing does not pay for the reading again.
        await context.SaveChangesAsync(cancellationToken);
        return requirements;
    }
}
