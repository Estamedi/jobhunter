using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.JobRoles.Commands.UpdateJobRole;

[Authorize]
public record UpdateJobRoleCommand : IRequest
{
    public required int Id { get; init; }
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

public class UpdateJobRoleCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateJobRoleCommand>
{
    public async Task Handle(UpdateJobRoleCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.JobRoles.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("JobRole", request.Id);

        entity.CompanyId = request.CompanyId;
        entity.JobTitleId = request.JobTitleId;
        entity.Title = request.Title;
        entity.JobLink = request.JobLink;
        entity.Source = request.Source;
        entity.Country = request.Country;
        entity.City = request.City;
        entity.WorkType = request.WorkType;
        entity.SalaryMin = request.SalaryMin;
        entity.SalaryMax = request.SalaryMax;
        entity.Currency = request.Currency;
        entity.EmploymentType = request.EmploymentType;
        entity.RoleStatus = request.RoleStatus;
        entity.Description = request.Description;
        entity.Requirements = request.Requirements;

        await context.SaveChangesAsync(cancellationToken);
    }
}
