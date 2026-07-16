using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.JobTitles.Queries.GetJobTitle;

public record JobTitleDetailDto(
    int Id, string Name, string? Description, int JobRoleCount,
    DateTimeOffset Created, DateTimeOffset LastModified
);

[Authorize]
public record GetJobTitleQuery(int Id) : IRequest<JobTitleDetailDto>;

public class GetJobTitleQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetJobTitleQuery, JobTitleDetailDto>
{
    public async Task<JobTitleDetailDto> Handle(GetJobTitleQuery request, CancellationToken cancellationToken)
    {
        var t = await context.JobTitles.AsNoTracking()
            .Where(t => t.Id == request.Id)
            .Select(t => new JobTitleDetailDto(
                t.Id, t.Name, t.Description, t.JobRoles.Count,
                t.Created, t.LastModified))
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("JobTitle", request.Id);

        return t;
    }
}
