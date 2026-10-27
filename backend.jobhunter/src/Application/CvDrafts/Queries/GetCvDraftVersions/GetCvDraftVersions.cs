using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts.Queries.GetCvDraftVersions;

public record CvDraftVersionSummaryDto(int Id, string Reason, DateTimeOffset Created);

[Authorize]
public record GetCvDraftVersionsQuery(int Id) : IRequest<IReadOnlyList<CvDraftVersionSummaryDto>>;

public class GetCvDraftVersionsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCvDraftVersionsQuery, IReadOnlyList<CvDraftVersionSummaryDto>>
{
    public async Task<IReadOnlyList<CvDraftVersionSummaryDto>> Handle(
        GetCvDraftVersionsQuery request, CancellationToken cancellationToken)
    {
        if (!await context.CvDrafts.AnyAsync(d => d.Id == request.Id, cancellationToken))
        {
            throw new NotFoundException(nameof(CvDraft), request.Id);
        }

        return await context.CvDraftVersions.AsNoTracking()
            .Where(v => v.CvDraftId == request.Id)
            .OrderByDescending(v => v.Id)
            .Select(v => new CvDraftVersionSummaryDto(v.Id, v.Reason, v.Created))
            .ToListAsync(cancellationToken);
    }
}
