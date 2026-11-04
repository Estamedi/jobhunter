using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Queries.GetProfileImportJob;

[Authorize]
public record GetProfileImportJobQuery(int Id) : IRequest<ProfileImportJobDto>;

public class GetProfileImportJobQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetProfileImportJobQuery, ProfileImportJobDto>
{
    public async Task<ProfileImportJobDto> Handle(GetProfileImportJobQuery request, CancellationToken cancellationToken)
    {
        var row = await context.ProfileImportJobs.AsNoTracking()
            .Where(j => j.Id == request.Id)
            .Select(j => new { Job = j, j.Cv.FileName })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException(nameof(ProfileImportJob), request.Id);

        return row.Job.ToDto(row.FileName);
    }
}
