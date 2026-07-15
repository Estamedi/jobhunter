using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Notes.Queries.GetNotes;

public record NoteDto(
    int Id,
    int? ApplicationId,
    string Content,
    DateTimeOffset Created,
    DateTimeOffset LastModified
);

public record GetNotesResult(IReadOnlyList<NoteDto> Items, int Total);

[Authorize]
public record GetNotesQuery(int? ApplicationId = null, int Page = 1, int PageSize = 20)
    : IRequest<GetNotesResult>;

public class GetNotesQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetNotesQuery, GetNotesResult>
{
    public async Task<GetNotesResult> Handle(GetNotesQuery request, CancellationToken cancellationToken)
    {
        var query = context.Notes.AsNoTracking();

        if (request.ApplicationId.HasValue)
        {
            query = query.Where(n => n.ApplicationId == request.ApplicationId);
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(n => n.Created)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(n => new NoteDto(n.Id, n.ApplicationId, n.Content, n.Created, n.LastModified))
            .ToListAsync(cancellationToken);

        return new GetNotesResult(items, total);
    }
}
