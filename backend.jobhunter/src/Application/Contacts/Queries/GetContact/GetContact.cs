using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Contacts.Queries.GetContact;

public record ContactDetailDto(
    int Id, string FullName, int CompanyId, string? CompanyName,
    string? JobTitle, string? Email, string? Phone, string? LinkedInUrl,
    string Type, string Warmth, string? Notes,
    DateTimeOffset Created, DateTimeOffset LastModified
);

[Authorize]
public record GetContactQuery(int Id) : IRequest<ContactDetailDto>;

public class GetContactQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetContactQuery, ContactDetailDto>
{
    public async Task<ContactDetailDto> Handle(GetContactQuery request, CancellationToken cancellationToken)
    {
        var c = await context.Contacts.AsNoTracking()
            .Where(c => c.Id == request.Id)
            .Select(c => new ContactDetailDto(
                c.Id, c.FullName, c.CompanyId, c.Company.Name,
                c.JobTitle, c.Email, c.Phone, c.LinkedInUrl,
                c.Type, c.Warmth, c.Notes, c.Created, c.LastModified))
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Contact", request.Id);

        return c;
    }
}
