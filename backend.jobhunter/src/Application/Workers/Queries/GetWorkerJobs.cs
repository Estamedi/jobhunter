using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Models;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Constants;

namespace backend.jobhunter.Application.Workers.Queries;

[Authorize(Roles = Roles.Administrator)]
public record GetWorkerJobsQuery(string State = "Failed", int Page = 1, int PageSize = 25)
    : IRequest<PaginatedList<WorkerJobDto>>;

public class GetWorkerJobsQueryValidator : AbstractValidator<GetWorkerJobsQuery>
{
    public static readonly string[] States = ["Enqueued", "Scheduled", "Processing", "Succeeded", "Failed", "Deleted"];

    public GetWorkerJobsQueryValidator()
    {
        RuleFor(x => x.State).Must(s => States.Contains(s, StringComparer.OrdinalIgnoreCase))
            .WithMessage("State must be one of: " + string.Join(", ", States));
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public class GetWorkerJobsQueryHandler(IBackgroundJobMonitor monitor)
    : IRequestHandler<GetWorkerJobsQuery, PaginatedList<WorkerJobDto>>
{
    public Task<PaginatedList<WorkerJobDto>> Handle(GetWorkerJobsQuery request, CancellationToken cancellationToken)
        => Task.FromResult(monitor.GetJobs(request.State, request.Page, request.PageSize));
}
