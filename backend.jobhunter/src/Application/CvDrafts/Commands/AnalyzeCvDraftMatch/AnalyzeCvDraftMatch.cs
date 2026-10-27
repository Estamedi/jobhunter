using System.Text.Json;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts.Commands.AnalyzeCvDraftMatch;

// Checks a draft against the skills its job description asks for. A command rather than a query because
// the first call asks the AI to read the job description and stores the result on the draft.
[Authorize]
public record AnalyzeCvDraftMatchCommand(int Id) : IRequest<CvJobMatchDto>;

public class AnalyzeCvDraftMatchCommandHandler(IApplicationDbContext context, ICvGenerationAiService aiService)
    : IRequestHandler<AnalyzeCvDraftMatchCommand, CvJobMatchDto>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task<CvJobMatchDto> Handle(AnalyzeCvDraftMatchCommand request, CancellationToken cancellationToken)
    {
        var draft = await context.CvDrafts.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(CvDraft), request.Id);

        if (string.IsNullOrWhiteSpace(draft.JobDescription))
        {
            return new CvJobMatchDto(false, [], [], 0, 0);
        }

        JobRequirementsDto? requirements = null;
        if (!string.IsNullOrWhiteSpace(draft.JobRequirementsJson))
        {
            requirements = JsonSerializer.Deserialize<JobRequirementsDto>(draft.JobRequirementsJson, Json);
        }

        if (requirements is null)
        {
            requirements = await aiService.ExtractRequirementsAsync(draft.JobDescription, cancellationToken);
            draft.JobRequirementsJson = JsonSerializer.Serialize(requirements, Json);
            await context.SaveChangesAsync(cancellationToken);
        }

        // The profile is searched too, so a skill the candidate has but the CV left out shows as such.
        var profileText = (await CvBackgroundBuilder.BuildAsync(
            context, draft.CandidateId, null, null, cancellationToken)).Text;

        return CvJobMatcher.Match(requirements, CvDraftContent.Deserialize(draft.ContentJson), profileText);
    }
}
