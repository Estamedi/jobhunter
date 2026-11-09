using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Models;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Constants;

namespace backend.jobhunter.Application.Consultations.Queries.GetConsultationLeads;

public record ConsultationLeadDto(
    int Id,
    DateTimeOffset Created,
    string FullName,
    string? Email,
    string Phone,
    string? Message,
    string? Locale);

[Authorize(Roles = Roles.Administrator)]
public record GetConsultationLeadsQuery(
    string? Search = null,
    int Page = 1,
    int PageSize = 25) : IRequest<PaginatedList<ConsultationLeadDto>>;

public class GetConsultationLeadsQueryValidator : AbstractValidator<GetConsultationLeadsQuery>
{
    public GetConsultationLeadsQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public class GetConsultationLeadsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetConsultationLeadsQuery, PaginatedList<ConsultationLeadDto>>
{
    public async Task<PaginatedList<ConsultationLeadDto>> Handle(GetConsultationLeadsQuery request, CancellationToken cancellationToken)
    {
        var query = context.ConsultationLeads.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToLower();
            query = query.Where(l => l.FullName.ToLower().Contains(term)
                || (l.Email != null && l.Email.ToLower().Contains(term))
                || l.Phone.Contains(term));
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(l => l.Created).ThenByDescending(l => l.Id)
            .Skip((request.Page - 1) * request.PageSize).Take(request.PageSize)
            .Select(l => new ConsultationLeadDto(l.Id, l.Created, l.FullName, l.Email, l.Phone, l.Message, l.Locale))
            .ToListAsync(cancellationToken);

        return new PaginatedList<ConsultationLeadDto>(items, total, request.Page, request.PageSize);
    }
}
