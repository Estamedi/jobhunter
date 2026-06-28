using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Companies.Queries.GetCompany;

public record CompanyDetailDto(
    int Id, string Name, string? Website, string? LinkedInUrl,
    string? Country, string? City, string? Industry, string? CompanySize,
    string Priority, string? Notes,
    DateTimeOffset Created, DateTimeOffset LastModified
);

[Authorize]
public record GetCompanyQuery(int Id) : IRequest<CompanyDetailDto>;

public class GetCompanyQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCompanyQuery, CompanyDetailDto>
{
    public async Task<CompanyDetailDto> Handle(GetCompanyQuery request, CancellationToken cancellationToken)
    {
        var c = await context.Companies.AsNoTracking()
            .Where(c => c.Id == request.Id)
            .Select(c => new CompanyDetailDto(
                c.Id, c.Name, c.Website, c.LinkedInUrl, c.Country, c.City,
                c.Industry, c.CompanySize, c.Priority, c.Notes,
                c.Created, c.LastModified))
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Company", request.Id);

        return c;
    }
}
