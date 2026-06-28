using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Companies.Commands.UpdateCompany;

[Authorize]
public record UpdateCompanyCommand : IRequest
{
    public required int Id { get; init; }
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

public class UpdateCompanyCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateCompanyCommand>
{
    public async Task Handle(UpdateCompanyCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Companies.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("Company", request.Id);

        entity.Name = request.Name;
        entity.Website = request.Website;
        entity.LinkedInUrl = request.LinkedInUrl;
        entity.Country = request.Country;
        entity.City = request.City;
        entity.Industry = request.Industry;
        entity.CompanySize = request.CompanySize;
        entity.Priority = request.Priority;
        entity.Notes = request.Notes;

        await context.SaveChangesAsync(cancellationToken);
    }
}
