using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Candidates.Queries.GetCandidates;

public record CandidateDto(
    int Id,
    string FullName,
    string Email,
    string? Phone,
    string? CurrentLocation,
    string? TargetCountries,
    string PreferredWorkType,
    string? TargetRoles,
    bool IsActive,
    string? Notes,
    int ApplicationCount,
    DateTimeOffset Created,
    DateTimeOffset LastModified
);

[Authorize]
public record GetCandidatesQuery(
    string? Search = null,
    bool? IsActive = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<GetCandidatesResult>;

public record GetCandidatesResult(IReadOnlyList<CandidateDto> Items, int Total);

public class GetCandidatesQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCandidatesQuery, GetCandidatesResult>
{
    public async Task<GetCandidatesResult> Handle(GetCandidatesQuery request, CancellationToken cancellationToken)
    {
        var query = context.Candidates.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(c => c.FullName.Contains(request.Search) || c.Email.Contains(request.Search));

        if (request.IsActive.HasValue)
            query = query.Where(c => c.IsActive == request.IsActive.Value);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(c => c.FullName)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new CandidateDto(
                c.Id, c.FullName, c.Email, c.Phone, c.CurrentLocation,
                c.TargetCountries, c.PreferredWorkType, c.TargetRoles,
                c.IsActive, c.Notes,
                c.Applications.Count,
                c.Created, c.LastModified))
            .ToListAsync(cancellationToken);

        return new GetCandidatesResult(items, total);
    }
}
