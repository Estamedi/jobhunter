using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Application.Common.Exceptions;

namespace backend.jobhunter.Application.Candidates.Queries.GetCandidate;

public record CandidateDetailDto(
    int Id,
    string FullName,
    string Email,
    string? Phone,
    string? CurrentLocation,
    string? TargetCountries,
    string PreferredWorkType,
    string? TargetRoles,
    bool IsActive,
    string? Notes,
    DateTimeOffset Created,
    DateTimeOffset LastModified
);

[Authorize]
public record GetCandidateQuery(int Id) : IRequest<CandidateDetailDto>;

public class GetCandidateQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCandidateQuery, CandidateDetailDto>
{
    public async Task<CandidateDetailDto> Handle(GetCandidateQuery request, CancellationToken cancellationToken)
    {
        var c = await context.Candidates
            .AsNoTracking()
            .Where(c => c.Id == request.Id)
            .Select(c => new CandidateDetailDto(
                c.Id, c.FullName, c.Email, c.Phone, c.CurrentLocation,
                c.TargetCountries, c.PreferredWorkType, c.TargetRoles,
                c.IsActive, c.Notes, c.Created, c.LastModified))
            .FirstOrDefaultAsync(cancellationToken);

        if (c is null) throw new NotFoundException("Candidate", request.Id);
        return c;
    }
}
