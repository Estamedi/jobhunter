using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Companies.Commands.CreateCompany;

[Authorize]
public record CreateCompanyCommand : IRequest<int>
{
    public required string Name { get; init; }
    public string? Website { get; init; }
    public string? LinkedInUrl { get; init; }
    public string? Country { get; init; }
    public string? City { get; init; }
    public string? Industry { get; init; }
    public string? CompanySize { get; init; }
    public string Priority { get; init; } = "Medium";
    public string? Notes { get; init; }
}

public class CreateCompanyCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateCompanyCommand, int>
{
    public async Task<int> Handle(CreateCompanyCommand request, CancellationToken cancellationToken)
    {
        var entity = new JobCompany
        {
            Name = request.Name,
            Website = request.Website,
            LinkedInUrl = request.LinkedInUrl,
            Country = request.Country,
            City = request.City,
            Industry = request.Industry,
            CompanySize = request.CompanySize,
            Priority = request.Priority,
            Notes = request.Notes
        };
        context.Companies.Add(entity);
        await context.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
