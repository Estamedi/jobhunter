using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.CandidateProfiles.Queries.GetProfileImportJob;

// The import a user left unfinished: the newest job for this candidate that is still reading, has a result
// waiting to be reviewed, or failed, and is less than a day old. It lets a closed window pick up where it
// stopped. Null when there is nothing to resume.
[Authorize]
public record GetLatestProfileImportJobQuery(int CandidateId) : IRequest<ProfileImportJobDto?>;

public class GetLatestProfileImportJobQueryHandler(IApplicationDbContext context, TimeProvider clock)
    : IRequestHandler<GetLatestProfileImportJobQuery, ProfileImportJobDto?>
{
    public static readonly TimeSpan MaxAge = TimeSpan.FromHours(24);

    public async Task<ProfileImportJobDto?> Handle(GetLatestProfileImportJobQuery request, CancellationToken cancellationToken)
    {
        var since = clock.GetUtcNow() - MaxAge;

        var row = await context.ProfileImportJobs.AsNoTracking()
            .Where(j => j.Cv.CandidateId == request.CandidateId && j.AppliedAt == null && j.Created >= since)
            .OrderByDescending(j => j.Created)
            .Select(j => new { Job = j, j.Cv.FileName })
            .FirstOrDefaultAsync(cancellationToken);

        return row?.Job.ToDto(row.FileName);
    }
}
