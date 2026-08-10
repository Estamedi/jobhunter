using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.JobRoles.Commands.CreateJobRole;

[Authorize]
public record CreateJobRoleCommand : IRequest<int>
{
    public required int CompanyId { get; init; }
    public int? JobTitleId { get; init; }
    public required string Title { get; init; }
    public string? JobLink { get; init; }
    public string Source { get; init; } = "Other";
    public string? Country { get; init; }
    public string? City { get; init; }
    public string WorkType { get; init; } = "Remote";
    public decimal? SalaryMin { get; init; }
    public decimal? SalaryMax { get; init; }
    public string? Currency { get; init; }
    public string EmploymentType { get; init; } = "FullTime";
    public string RoleStatus { get; init; } = "Open";
    public string? Description { get; init; }
    public string? Requirements { get; init; }
}

public class CreateJobRoleCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateJobRoleCommand, int>
{
    public async Task<int> Handle(CreateJobRoleCommand request, CancellationToken cancellationToken)
    {
        // Same posting saved before (same company + link)? Reuse that role instead
        // of creating a duplicate row.
        if (!string.IsNullOrWhiteSpace(request.JobLink))
        {
            var existingId = await context.JobRoles
                .Where(r => r.CompanyId == request.CompanyId && r.JobLink == request.JobLink)
                .Select(r => r.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (existingId != 0) return existingId;
        }

        var entity = new JobRole
        {
            CompanyId = request.CompanyId,
            JobTitleId = request.JobTitleId,
            Title = request.Title,
            JobLink = request.JobLink,
            Source = request.Source,
            Country = request.Country,
            City = request.City,
            WorkType = request.WorkType,
            SalaryMin = request.SalaryMin,
            SalaryMax = request.SalaryMax,
            Currency = request.Currency,
            EmploymentType = request.EmploymentType,
            RoleStatus = request.RoleStatus,
            Description = request.Description,
            Requirements = request.Requirements
        };
        context.JobRoles.Add(entity);
        await context.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
