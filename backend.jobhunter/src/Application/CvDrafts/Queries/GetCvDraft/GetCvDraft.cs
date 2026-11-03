using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;

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
    int? PreviousVersionId = null,
    // Completed, Pending, Running or Failed. A draft is written in the background.
    string Status = "Completed",
    // Why the last attempt failed; set only when Status is Failed.
    string? Error = null
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

        // The warnings found while the draft was written are read back here, so the UI can show them
        // once when it sees the draft finish.
        return draft.ToDetailDto(CvDraftDetailMapping.StoredWarnings(draft));
    }
}

internal static class CvDraftDetailMapping
{
    public static CvDraftDetailDto ToDetailDto(
        this CvDraft d, IReadOnlyList<string>? warnings = null, int? previousVersionId = null) => new(
        d.Id, d.CandidateId, d.SourceCvId, d.JobApplicationId, d.Title, d.JobTitle,
        d.JobDescription, d.Instructions, d.TemplateId,
        CvDraftContent.Deserialize(d.ContentJson), d.Created, d.LastModified, warnings, previousVersionId,
        d.Status.ToString(), d.Status == CvDraftStatus.Failed ? d.GenerationError : null);

    public static IReadOnlyList<string>? StoredWarnings(CvDraft d)
        => string.IsNullOrWhiteSpace(d.GenerationWarningsJson)
            ? null
            : System.Text.Json.JsonSerializer.Deserialize<List<string>>(d.GenerationWarningsJson);
}
