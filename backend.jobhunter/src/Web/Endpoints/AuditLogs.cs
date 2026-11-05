using backend.jobhunter.Application.AuditLogs.Queries.GetAuditLogs;
using backend.jobhunter.Application.Common.Models;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class AuditLogs : IEndpointGroup
{
    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.RequireAuthorization();
        groupBuilder.MapGet(GetAuditLogs, string.Empty);
    }

    [EndpointSummary("List the audit log")]
    [EndpointDescription("Administrator only. A paged list of the actions users took (writes and sign-ins), newest first, with whether each worked and why not. Secrets are never stored.")]
    public static async Task<Ok<PaginatedList<AuditLogDto>>> GetAuditLogs(
        ISender sender,
        CancellationToken cancellationToken,
        string? search = null,
        string? action = null,
        bool? succeeded = null,
        DateTimeOffset? from = null,
        DateTimeOffset? to = null,
        int page = 1,
        int pageSize = 25)
        => TypedResults.Ok(await sender.Send(new GetAuditLogsQuery(search, action, succeeded, from, to, page, pageSize), cancellationToken));
}
