using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Activities.Queries.GetActivities;

public record ActivityDto(
    int Id, int CandidateId, string CandidateName,
    int? ApplicationId, int? CompanyId, string? CompanyName,
    int? ContactId, string? ContactName,
    string Type, DateTimeOffset ActivityDate,
    string? Outcome, string? Notes,
    DateTimeOffset Created
);

public record GetActivitiesResult(IReadOnlyList<ActivityDto> Items, int Total);

[Authorize]
public record GetActivitiesQuery(
    int? CandidateId = null,
    int? ApplicationId = null,
    int? CompanyId = null,
    string? Type = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<GetActivitiesResult>;

public class GetActivitiesQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetActivitiesQuery, GetActivitiesResult>
{
    public async Task<GetActivitiesResult> Handle(GetActivitiesQuery request, CancellationToken cancellationToken)
    {
        var query = context.Activities.AsNoTracking();

        if (request.CandidateId.HasValue)
            query = query.Where(a => a.CandidateId == request.CandidateId.Value);
        if (request.ApplicationId.HasValue)
            query = query.Where(a => a.ApplicationId == request.ApplicationId.Value);
        if (request.CompanyId.HasValue)
            query = query.Where(a => a.CompanyId == request.CompanyId.Value);
        if (!string.IsNullOrWhiteSpace(request.Type))
            query = query.Where(a => a.Type == request.Type);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(a => a.ActivityDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => new ActivityDto(
                a.Id, a.CandidateId, a.Candidate.FullName,
                a.ApplicationId, a.CompanyId,
                a.Company != null ? a.Company.Name : null,
                a.ContactId,
                a.Contact != null ? a.Contact.FullName : null,
                a.Type, a.ActivityDate, a.Outcome, a.Notes, a.Created))
            .ToListAsync(cancellationToken);

        return new GetActivitiesResult(items, total);
    }
}
