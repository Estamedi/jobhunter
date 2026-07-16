using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.JobTitles.Queries.GetJobTitles;

public record JobTitleDto(
    int Id, string Name, string? Description, int JobRoleCount,
    DateTimeOffset Created, DateTimeOffset LastModified
);

public record GetJobTitlesResult(IReadOnlyList<JobTitleDto> Items, int Total);

[Authorize]
public record GetJobTitlesQuery(
    string? Search = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<GetJobTitlesResult>;

public class GetJobTitlesQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetJobTitlesQuery, GetJobTitlesResult>
{
    public async Task<GetJobTitlesResult> Handle(GetJobTitlesQuery request, CancellationToken cancellationToken)
    {
        var query = context.JobTitles.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(t => t.Name.ToLower().Contains(search));
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(t => t.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new JobTitleDto(
                t.Id, t.Name, t.Description, t.JobRoles.Count,
                t.Created, t.LastModified))
            .ToListAsync(cancellationToken);

        return new GetJobTitlesResult(items, total);
    }
}
