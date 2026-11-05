using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Constants;
using backend.jobhunter.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace backend.jobhunter.Application.Workers.Queries;

[Authorize(Roles = Roles.Administrator)]
public record GetWorkersOverviewQuery : IRequest<WorkersOverviewDto>;

public class GetWorkersOverviewQueryHandler(IBackgroundJobMonitor monitor, IApplicationDbContext context)
    : IRequestHandler<GetWorkersOverviewQuery, WorkersOverviewDto>
{
    public async Task<WorkersOverviewDto> Handle(GetWorkersOverviewQuery request, CancellationToken cancellationToken)
    {
        var overview = monitor.GetOverview();

        var drafts = await context.CvDrafts.IgnoreQueryFilters().GroupBy(d => d.Status)
            .Select(g => new { g.Key, Count = g.Count() }).ToListAsync(cancellationToken);
        var imports = await context.ProfileImportJobs.IgnoreQueryFilters().GroupBy(j => j.Status)
            .Select(g => new { g.Key, Count = g.Count() }).ToListAsync(cancellationToken);
        var uploads = await context.Cvs.IgnoreQueryFilters().GroupBy(c => c.UploadStatus)
            .Select(g => new { g.Key, Count = g.Count() }).ToListAsync(cancellationToken);

        var items = new List<WorkItemCountDto>();
        items.AddRange(drafts.Select(x => new WorkItemCountDto("CV generation", x.Key.ToString(), x.Count)));
        items.AddRange(imports.Select(x => new WorkItemCountDto("Profile import", x.Key.ToString(), x.Count)));
        items.AddRange(uploads.Select(x => new WorkItemCountDto("CV upload", x.Key.ToString(), x.Count)));

        return overview with { WorkItems = items };
    }
}
