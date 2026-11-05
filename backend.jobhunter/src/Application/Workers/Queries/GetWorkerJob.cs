using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Constants;

namespace backend.jobhunter.Application.Workers.Queries;

[Authorize(Roles = Roles.Administrator)]
public record GetWorkerJobQuery(string Id) : IRequest<WorkerJobDetailDto>;

public class GetWorkerJobQueryHandler(IBackgroundJobMonitor monitor) : IRequestHandler<GetWorkerJobQuery, WorkerJobDetailDto>
{
    public Task<WorkerJobDetailDto> Handle(GetWorkerJobQuery request, CancellationToken cancellationToken)
        => Task.FromResult(monitor.GetJob(request.Id) ?? throw new NotFoundException("WorkerJob", request.Id));
}
