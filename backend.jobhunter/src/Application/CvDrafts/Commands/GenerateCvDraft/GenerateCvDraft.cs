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
}

public class GenerateCvDraftCommandHandler(IApplicationDbContext context, ICvGenerationAiService aiService)
    : IRequestHandler<GenerateCvDraftCommand, CvDraftDetailDto>
{
    public async Task<CvDraftDetailDto> Handle(GenerateCvDraftCommand request, CancellationToken cancellationToken)
    {
        var candidate = await context.Candidates.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.CandidateId, cancellationToken)
            ?? throw new NotFoundException(nameof(Candidate), request.CandidateId);

        if (request.SourceCvId.HasValue
            && !await context.Cvs.AnyAsync(c => c.Id == request.SourceCvId, cancellationToken))
        {
            throw new NotFoundException(nameof(Cv), request.SourceCvId.Value);
        }

        if (request.JobApplicationId.HasValue
            && !await context.Applications.AnyAsync(a => a.Id == request.JobApplicationId, cancellationToken))
        {
            throw new NotFoundException(nameof(JobApplication), request.JobApplicationId.Value);
        }

        var background = await CvBackgroundBuilder.BuildAsync(
            context, request.CandidateId, request.BackgroundText, cancellationToken);

        var warnings = new List<string>(background.Warnings);
        if (request.JobDescription?.Length > CvLimits.MaxFieldLength)
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
            JobDescription = request.JobDescription,
            Instructions = request.Instructions,
            BackgroundText = background.Text,
            Tone = request.Tone,
            Language = request.Language,
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
            JobDescription = request.JobDescription,
            Instructions = request.Instructions,
            Tone = request.Tone,
            Language = request.Language,
            TemplateId = string.IsNullOrWhiteSpace(request.TemplateId) ? "classic" : request.TemplateId,
            ContentJson = CvDraftContent.Serialize(generated),
        };

        context.CvDrafts.Add(draft);
        await context.SaveChangesAsync(cancellationToken);

        return draft.ToDetailDto(warnings);
    }
}
