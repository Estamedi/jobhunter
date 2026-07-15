using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Cvs.Queries.GetCvDownload;

public record CvDownloadDto(string FileName, string ContentType, string StorageKey);

[Authorize]
public record GetCvDownloadQuery(int Id) : IRequest<CvDownloadDto>;

public class GetCvDownloadQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCvDownloadQuery, CvDownloadDto>
{
    public async Task<CvDownloadDto> Handle(GetCvDownloadQuery request, CancellationToken cancellationToken)
    {
        var dto = await context.Cvs
            .AsNoTracking()
            .Where(c => c.Id == request.Id)
            .Select(c => new CvDownloadDto(c.FileName, c.ContentType, c.StorageKey))
            .FirstOrDefaultAsync(cancellationToken);

        return dto ?? throw new NotFoundException(nameof(Cv), request.Id);
    }
}
