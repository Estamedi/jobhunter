using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Queries.GetCandidatePhoto;

public record CandidatePhotoDto(byte[] Data, string ContentType);

[Authorize]
public record GetCandidatePhotoQuery(int CandidateId) : IRequest<CandidatePhotoDto>;

public class GetCandidatePhotoQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCandidatePhotoQuery, CandidatePhotoDto>
{
    public async Task<CandidatePhotoDto> Handle(GetCandidatePhotoQuery request, CancellationToken cancellationToken)
    {
        var photo = await context.CandidatePhotos.AsNoTracking()
            .Where(p => p.CandidateId == request.CandidateId)
            .Select(p => new CandidatePhotoDto(p.Data, p.ContentType))
            .FirstOrDefaultAsync(cancellationToken);

        return photo ?? throw new NotFoundException(nameof(CandidatePhoto), request.CandidateId);
    }
}
