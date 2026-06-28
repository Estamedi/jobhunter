using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Companies.Queries.GetCompanies;

public record CompanyDto(
    int Id, string Name, string? Website, string? LinkedInUrl,
    string? Country, string? City, string? Industry, string? CompanySize,
    string Priority, string? Notes,
    int JobRoleCount, int ApplicationCount,
    DateTimeOffset Created, DateTimeOffset LastModified
);

public record GetCompaniesResult(IReadOnlyList<CompanyDto> Items, int Total);

[Authorize]
public record GetCompaniesQuery(
    string? Search = null,
    string? Priority = null,
    string? Country = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<GetCompaniesResult>;

public class GetCompaniesQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCompaniesQuery, GetCompaniesResult>
{
    public async Task<GetCompaniesResult> Handle(GetCompaniesQuery request, CancellationToken cancellationToken)
    {
        var query = context.Companies.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(c => c.Name.Contains(request.Search));
        if (!string.IsNullOrWhiteSpace(request.Priority))
            query = query.Where(c => c.Priority == request.Priority);
        if (!string.IsNullOrWhiteSpace(request.Country))
            query = query.Where(c => c.Country == request.Country);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(c => c.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new CompanyDto(
                c.Id, c.Name, c.Website, c.LinkedInUrl, c.Country, c.City,
                c.Industry, c.CompanySize, c.Priority, c.Notes,
                c.JobRoles.Count, c.Applications.Count,
                c.Created, c.LastModified))
            .ToListAsync(cancellationToken);

        return new GetCompaniesResult(items, total);
    }
}
