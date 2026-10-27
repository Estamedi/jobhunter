using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Application.CvDrafts.Queries.GetCvDraft;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts.Commands.GenerateCvDraft;

[Authorize]
public record GenerateCvDraftCommand : IRequest<CvDraftDetailDto>
{
    public required int CandidateId { get; init; }
    public required string JobTitle { get; init; }
    public string? Title { get; init; }
    public string? JobDescription { get; init; }
    public string? Instructions { get; init; }
    public string? BackgroundText { get; init; }
    public int? SourceCvId { get; init; }
    public int? JobApplicationId { get; init; }
    public string? TemplateId { get; init; }
    public string? Tone { get; init; }
    public string? Language { get; init; }
    // CEFR writing level, A2 to C2. Defaults to B2 when not given.
    public string? LanguageLevel { get; init; }
}

public class GenerateCvDraftCommandHandler(
    IApplicationDbContext context, ICvGenerationAiService aiService, IFileStorage fileStorage, ICvTextExtractor textExtractor)
    : IRequestHandler<GenerateCvDraftCommand, CvDraftDetailDto>
{
    public async Task<CvDraftDetailDto> Handle(GenerateCvDraftCommand request, CancellationToken cancellationToken)
    {
        var candidate = await context.Candidates.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.CandidateId, cancellationToken)
            ?? throw new NotFoundException(nameof(Candidate), request.CandidateId);

        Cv? sourceCv = null;
        if (request.SourceCvId.HasValue)
        {
            sourceCv = await context.Cvs.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == request.SourceCvId, cancellationToken)
                ?? throw new NotFoundException(nameof(Cv), request.SourceCvId.Value);
        }

        var jobDescription = request.JobDescription;
        if (request.JobApplicationId.HasValue)
        {
            var role = await context.Applications.AsNoTracking()
                .Where(a => a.Id == request.JobApplicationId)
                .Select(a => new { a.JobRole.Description, a.JobRole.Requirements })
                .FirstOrDefaultAsync(cancellationToken)
                ?? throw new NotFoundException(nameof(JobApplication), request.JobApplicationId.Value);

            // A draft made from an application is tailored to that job even if the form sent no description.
            if (string.IsNullOrWhiteSpace(jobDescription))
            {
                jobDescription = CvJobPosting.Compose(role.Description, role.Requirements);
            }
        }

        var warnings = new List<string>();
        var sourceCvText = await CvSourceText.ReadAsync(sourceCv, fileStorage, textExtractor, warnings, cancellationToken);
        var background = await CvBackgroundBuilder.BuildAsync(
            context, request.CandidateId, request.BackgroundText, sourceCvText, cancellationToken);
        warnings.AddRange(background.Warnings);

        if (string.IsNullOrWhiteSpace(jobDescription))
        {
            warnings.Add("No job description was given, so this CV is general rather than tailored to a job.");
        }
        else if (jobDescription.Length > CvLimits.MaxFieldLength)
        {
            warnings.Add("The job description was too long, so the end of it was cut off before writing the CV.");
        }
        if (request.Instructions?.Length > CvLimits.MaxFieldLength)
        {
            warnings.Add("Your instructions were too long, so the end of them was cut off before writing the CV.");
        }

        var generated = await aiService.GenerateAsync(new CvGenerationRequest
        {
            FullName = candidate.FullName,
            Email = candidate.Email,
            Phone = candidate.Phone,
            Location = candidate.CurrentLocation,
            JobTitle = request.JobTitle,
            JobDescription = jobDescription,
            Instructions = request.Instructions,
            BackgroundText = background.Text,
            Tone = request.Tone,
            Language = request.Language,
            LanguageLevel = CvLanguageLevel.Normalize(request.LanguageLevel),
            TargetPages = CvLengthGuide.TargetPages(background.Profile, DateOnly.FromDateTime(DateTime.UtcNow)),
        }, cancellationToken);

        generated = CvProfileMerger.Merge(generated, background.Profile, warnings);
        warnings.AddRange(CvGroundingValidator.Validate(generated, background.Text));

        var draft = new CvDraft
        {
            CandidateId = request.CandidateId,
            SourceCvId = request.SourceCvId,
            JobApplicationId = request.JobApplicationId,
            Title = string.IsNullOrWhiteSpace(request.Title) ? $"{request.JobTitle} CV" : request.Title,
            JobTitle = request.JobTitle,
            JobDescription = jobDescription is { Length: > CvLimits.MaxFieldLength }
                ? jobDescription[..CvLimits.MaxFieldLength]
                : jobDescription,
            Instructions = request.Instructions,
            Tone = request.Tone,
            Language = request.Language,
            LanguageLevel = CvLanguageLevel.Normalize(request.LanguageLevel),
            TemplateId = string.IsNullOrWhiteSpace(request.TemplateId) ? "classic" : request.TemplateId,
            ContentJson = CvDraftContent.Serialize(generated),
        };

        context.CvDrafts.Add(draft);
        await context.SaveChangesAsync(cancellationToken);

        return draft.ToDetailDto(warnings);
    }
}
