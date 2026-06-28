using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.JobRoles.Queries.GetJobRoles;

public record JobRoleDto(
    int Id, int CompanyId, string? CompanyName, string Title,
    string? JobLink, string Source, string? Country, string? City,
    string WorkType, decimal? SalaryMin, decimal? SalaryMax, string? Currency,
    string EmploymentType, string RoleStatus, string? Description,
    int ApplicationCount, DateTimeOffset Created, DateTimeOffset LastModified
);

public record GetJobRolesResult(IReadOnlyList<JobRoleDto> Items, int Total);

[Authorize]
public record GetJobRolesQuery(
    string? Search = null,
    int? CompanyId = null,
    string? RoleStatus = null,
    string? WorkType = null,
    string? Country = null,
    string? Source = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<GetJobRolesResult>;

public class GetJobRolesQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetJobRolesQuery, GetJobRolesResult>
{
    public async Task<GetJobRolesResult> Handle(GetJobRolesQuery request, CancellationToken cancellationToken)
    {
        var query = context.JobRoles.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(r => r.Title.Contains(request.Search));
        if (request.CompanyId.HasValue)
            query = query.Where(r => r.CompanyId == request.CompanyId.Value);
        if (!string.IsNullOrWhiteSpace(request.RoleStatus))
            query = query.Where(r => r.RoleStatus == request.RoleStatus);
        if (!string.IsNullOrWhiteSpace(request.WorkType))
            query = query.Where(r => r.WorkType == request.WorkType);
        if (!string.IsNullOrWhiteSpace(request.Country))
            query = query.Where(r => r.Country == request.Country);
        if (!string.IsNullOrWhiteSpace(request.Source))
            query = query.Where(r => r.Source == request.Source);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(r => r.Created)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new JobRoleDto(
                r.Id, r.CompanyId, r.Company.Name, r.Title, r.JobLink,
                r.Source, r.Country, r.City, r.WorkType,
                r.SalaryMin, r.SalaryMax, r.Currency,
                r.EmploymentType, r.RoleStatus, r.Description,
                r.Applications.Count, r.Created, r.LastModified))
            .ToListAsync(cancellationToken);

        return new GetJobRolesResult(items, total);
    }
}
