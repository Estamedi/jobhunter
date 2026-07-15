using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Cvs.Queries.GetCvs;

public record CvDto(
    int Id,
    int CandidateId,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    DateTimeOffset UploadedDate
);

public record GetCvsResult(IReadOnlyList<CvDto> Items, int Total);

[Authorize]
public record GetCvsQuery(int? CandidateId = null, int Page = 1, int PageSize = 20)
    : IRequest<GetCvsResult>;

public class GetCvsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCvsQuery, GetCvsResult>
{
    public async Task<GetCvsResult> Handle(GetCvsQuery request, CancellationToken cancellationToken)
    {
        var query = context.Cvs.AsNoTracking();

        if (request.CandidateId.HasValue)
        {
            query = query.Where(c => c.CandidateId == request.CandidateId);
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(c => c.Created)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new CvDto(c.Id, c.CandidateId, c.FileName, c.ContentType, c.FileSizeBytes, c.Created))
            .ToListAsync(cancellationToken);

        return new GetCvsResult(items, total);
    }
}
