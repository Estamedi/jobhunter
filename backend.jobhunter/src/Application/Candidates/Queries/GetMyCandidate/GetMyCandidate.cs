using backend.jobhunter.Application.Candidates.Queries.GetCandidate;
using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Candidates.Queries.GetMyCandidate;

[Authorize]
public record GetMyCandidateQuery : IRequest<CandidateDetailDto>;

/// <summary>
/// A job seeker's own candidate. The owner query filter already limits Candidates to the
/// signed-in user, and the oldest one wins so the result never depends on names or sort order.
/// </summary>
public class GetMyCandidateQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetMyCandidateQuery, CandidateDetailDto>
{
    public async Task<CandidateDetailDto> Handle(GetMyCandidateQuery request, CancellationToken cancellationToken)
    {
        var c = await context.Candidates
            .AsNoTracking()
            .OrderBy(c => c.Id)
            .Select(c => new CandidateDetailDto(
                c.Id, c.FullName, c.Email, c.Phone, c.CurrentLocation,
                c.TargetCountries, c.PreferredWorkType, c.TargetRoles,
                c.IsActive, c.Notes, c.Created, c.LastModified))
            .FirstOrDefaultAsync(cancellationToken);

        return c ?? throw new NotFoundException("Candidate", "me");
    }
}
