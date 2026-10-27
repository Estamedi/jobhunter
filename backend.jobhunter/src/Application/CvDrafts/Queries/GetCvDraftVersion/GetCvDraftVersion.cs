using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts.Queries.GetCvDraftVersion;

public record CvDraftVersionDetailDto(int Id, string Reason, DateTimeOffset Created, GeneratedCvDto Content);

[Authorize]
public record GetCvDraftVersionQuery(int Id, int VersionId) : IRequest<CvDraftVersionDetailDto>;

public class GetCvDraftVersionQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCvDraftVersionQuery, CvDraftVersionDetailDto>
{
    public async Task<CvDraftVersionDetailDto> Handle(GetCvDraftVersionQuery request, CancellationToken cancellationToken)
    {
        if (!await context.CvDrafts.AnyAsync(d => d.Id == request.Id, cancellationToken))
        {
            throw new NotFoundException(nameof(CvDraft), request.Id);
        }

        var version = await context.CvDraftVersions.AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == request.VersionId && v.CvDraftId == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(CvDraftVersion), request.VersionId);

        return new CvDraftVersionDetailDto(
            version.Id, version.Reason, version.Created, CvDraftContent.Deserialize(version.ContentJson));
    }
}
