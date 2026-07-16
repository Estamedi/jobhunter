using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Contacts.Queries.GetContacts;

public record ContactDto(
    int Id, string FullName, int CompanyId, string? CompanyName,
    string? JobTitle, string? Email, string? Phone, string? LinkedInUrl,
    string Type, string Warmth, string? Notes,
    DateTimeOffset Created, DateTimeOffset LastModified
);

public record GetContactsResult(IReadOnlyList<ContactDto> Items, int Total);

[Authorize]
public record GetContactsQuery(
    string? Search = null,
    int? CompanyId = null,
    string? Type = null,
    string? Warmth = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<GetContactsResult>;

public class GetContactsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetContactsQuery, GetContactsResult>
{
    public async Task<GetContactsResult> Handle(GetContactsQuery request, CancellationToken cancellationToken)
    {
        var query = context.Contacts.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(c => c.FullName.ToLower().Contains(search) || (c.Email != null && c.Email.ToLower().Contains(search)));
        }
        if (request.CompanyId.HasValue)
            query = query.Where(c => c.CompanyId == request.CompanyId.Value);
        if (!string.IsNullOrWhiteSpace(request.Type))
            query = query.Where(c => c.Type == request.Type);
        if (!string.IsNullOrWhiteSpace(request.Warmth))
            query = query.Where(c => c.Warmth == request.Warmth);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(c => c.FullName)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new ContactDto(
                c.Id, c.FullName, c.CompanyId, c.Company.Name,
                c.JobTitle, c.Email, c.Phone, c.LinkedInUrl,
                c.Type, c.Warmth, c.Notes, c.Created, c.LastModified))
            .ToListAsync(cancellationToken);

        return new GetContactsResult(items, total);
    }
}
