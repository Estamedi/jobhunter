using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.JobRoles.Queries.GetJobRole;

public record JobRoleDetailDto(
    int Id, int CompanyId, string? CompanyName, int? JobTitleId, string? JobTitleName, string Title,
    string? JobLink, string Source, string? Country, string? City,
    string WorkType, decimal? SalaryMin, decimal? SalaryMax, string? Currency,
    string EmploymentType, string RoleStatus,
    string? Description, string? Requirements,
    DateTimeOffset Created, DateTimeOffset LastModified
);

[Authorize]
public record GetJobRoleQuery(int Id) : IRequest<JobRoleDetailDto>;

public class GetJobRoleQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetJobRoleQuery, JobRoleDetailDto>
{
    public async Task<JobRoleDetailDto> Handle(GetJobRoleQuery request, CancellationToken cancellationToken)
    {
        var r = await context.JobRoles.AsNoTracking()
            .Where(r => r.Id == request.Id)
            .Select(r => new JobRoleDetailDto(
                r.Id, r.CompanyId, r.Company.Name, r.JobTitleId, r.JobTitle != null ? r.JobTitle.Name : null, r.Title, r.JobLink,
                r.Source, r.Country, r.City, r.WorkType,
                r.SalaryMin, r.SalaryMax, r.Currency,
                r.EmploymentType, r.RoleStatus,
                r.Description, r.Requirements,
                r.Created, r.LastModified))
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("JobRole", request.Id);

        return r;
    }
}
