using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Models;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Constants;

namespace backend.jobhunter.Application.AuditLogs.Queries.GetAuditLogs;

public record AuditLogDto(
    int Id,
    DateTimeOffset Timestamp,
    string? UserId,
    string? UserEmail,
    string Action,
    string? Payload,
    bool Succeeded,
    string? Error,
    int DurationMs);

[Authorize(Roles = Roles.Administrator)]
public record GetAuditLogsQuery(
    string? Search = null,
    string? Action = null,
    bool? Succeeded = null,
    DateTimeOffset? From = null,
    DateTimeOffset? To = null,
    int Page = 1,
    int PageSize = 25) : IRequest<PaginatedList<AuditLogDto>>;

public class GetAuditLogsQueryValidator : AbstractValidator<GetAuditLogsQuery>
{
    public GetAuditLogsQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public class GetAuditLogsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetAuditLogsQuery, PaginatedList<AuditLogDto>>
{
    public async Task<PaginatedList<AuditLogDto>> Handle(GetAuditLogsQuery request, CancellationToken cancellationToken)
    {
        var query = context.AuditLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToLower();
            query = query.Where(a => (a.UserEmail != null && a.UserEmail.ToLower().Contains(term)) || a.Action.ToLower().Contains(term));
        }
        if (!string.IsNullOrWhiteSpace(request.Action)) query = query.Where(a => a.Action == request.Action);
        if (request.Succeeded is { } ok) query = query.Where(a => a.Succeeded == ok);
        if (request.From is { } from) query = query.Where(a => a.Timestamp >= from);
        if (request.To is { } to) query = query.Where(a => a.Timestamp <= to);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(a => a.Timestamp).ThenByDescending(a => a.Id)
            .Skip((request.Page - 1) * request.PageSize).Take(request.PageSize)
            .Select(a => new AuditLogDto(a.Id, a.Timestamp, a.UserId, a.UserEmail, a.Action, a.Payload, a.Succeeded, a.Error, a.DurationMs))
            .ToListAsync(cancellationToken);

        return new PaginatedList<AuditLogDto>(items, total, request.Page, request.PageSize);
    }
}
