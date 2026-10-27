using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts.Queries.GetCvDraft;

public record CvDraftDetailDto(
    int Id,
    int CandidateId,
    int? SourceCvId,
    int? JobApplicationId,
    string Title,
    string JobTitle,
    string? JobDescription,
    string? Instructions,
    string TemplateId,
    GeneratedCvDto Content,
    DateTimeOffset Created,
    DateTimeOffset LastModified,
    // Only set on the response to generate and regenerate; never stored.
    IReadOnlyList<string>? Warnings = null,
    // The saved copy of the content this change replaced; Undo restores exactly this version. Never stored.
    int? PreviousVersionId = null
);

[Authorize]
public record GetCvDraftQuery(int Id) : IRequest<CvDraftDetailDto>;

public class GetCvDraftQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCvDraftQuery, CvDraftDetailDto>
{
    public async Task<CvDraftDetailDto> Handle(GetCvDraftQuery request, CancellationToken cancellationToken)
    {
        var draft = await context.CvDrafts.AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(CvDraft), request.Id);

        return draft.ToDetailDto();
    }
}

internal static class CvDraftDetailMapping
{
    public static CvDraftDetailDto ToDetailDto(
        this CvDraft d, IReadOnlyList<string>? warnings = null, int? previousVersionId = null) => new(
        d.Id, d.CandidateId, d.SourceCvId, d.JobApplicationId, d.Title, d.JobTitle,
        d.JobDescription, d.Instructions, d.TemplateId,
        CvDraftContent.Deserialize(d.ContentJson), d.Created, d.LastModified, warnings, previousVersionId);
}
