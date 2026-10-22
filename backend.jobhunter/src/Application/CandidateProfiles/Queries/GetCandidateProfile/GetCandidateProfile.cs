using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Queries.GetCandidateProfile;

[Authorize]
public record GetCandidateProfileQuery(int CandidateId) : IRequest<CandidateProfileDto>;

public class GetCandidateProfileQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCandidateProfileQuery, CandidateProfileDto>
{
    public async Task<CandidateProfileDto> Handle(GetCandidateProfileQuery request, CancellationToken cancellationToken)
    {
        var profile = await context.CandidateProfiles.AsNoTracking()
            .Include(p => p.Experiences)
            .Include(p => p.Educations)
            .Include(p => p.Skills)
            .FirstOrDefaultAsync(p => p.CandidateId == request.CandidateId, cancellationToken);

        if (profile is not null) return profile.ToDto();

        if (!await context.Candidates.AnyAsync(c => c.Id == request.CandidateId, cancellationToken))
        {
            throw new NotFoundException(nameof(Candidate), request.CandidateId);
        }

        // No profile yet: an empty one is returned and created on the first save.
        return new CandidateProfileDto(null, request.CandidateId, null, null, [], [], []);
    }
}
