using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.CvDrafts.Queries.GetCvDrafts;

public record CvDraftSummaryDto(
    int Id,
    int CandidateId,
    int? JobApplicationId,
    string Title,
    string JobTitle,
    string TemplateId,
    DateTimeOffset Created,
    DateTimeOffset LastModified
);

public record GetCvDraftsResult(IReadOnlyList<CvDraftSummaryDto> Items, int Total);

[Authorize]
public record GetCvDraftsQuery(int? CandidateId = null, int? JobApplicationId = null, int Page = 1, int PageSize = 20)
    : IRequest<GetCvDraftsResult>;

public class GetCvDraftsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCvDraftsQuery, GetCvDraftsResult>
{
    public async Task<GetCvDraftsResult> Handle(GetCvDraftsQuery request, CancellationToken cancellationToken)
    {
        var query = context.CvDrafts.AsNoTracking();

        if (request.CandidateId.HasValue)
        {
            query = query.Where(d => d.CandidateId == request.CandidateId);
        }

        if (request.JobApplicationId.HasValue)
        {
            query = query.Where(d => d.JobApplicationId == request.JobApplicationId);
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(d => d.LastModified)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(d => new CvDraftSummaryDto(
                d.Id, d.CandidateId, d.JobApplicationId, d.Title, d.JobTitle, d.TemplateId, d.Created, d.LastModified))
            .ToListAsync(cancellationToken);

        return new GetCvDraftsResult(items, total);
    }
}
