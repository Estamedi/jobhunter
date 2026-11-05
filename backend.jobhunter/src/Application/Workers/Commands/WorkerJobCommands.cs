using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Constants;

namespace backend.jobhunter.Application.Workers.Commands;

[Authorize(Roles = Roles.Administrator)]
public record RequeueWorkerJobCommand(string Id) : IRequest;

public class RequeueWorkerJobCommandHandler(IBackgroundJobMonitor monitor) : IRequestHandler<RequeueWorkerJobCommand>
{
    public Task Handle(RequeueWorkerJobCommand request, CancellationToken cancellationToken)
        => monitor.Requeue(request.Id) ? Task.CompletedTask : throw new NotFoundException("WorkerJob", request.Id);
}

[Authorize(Roles = Roles.Administrator)]
public record DeleteWorkerJobCommand(string Id) : IRequest;

public class DeleteWorkerJobCommandHandler(IBackgroundJobMonitor monitor) : IRequestHandler<DeleteWorkerJobCommand>
{
    public Task Handle(DeleteWorkerJobCommand request, CancellationToken cancellationToken)
        => monitor.Delete(request.Id) ? Task.CompletedTask : throw new NotFoundException("WorkerJob", request.Id);
}

[Authorize(Roles = Roles.Administrator)]
public record TriggerRecurringWorkerJobCommand(string Id) : IRequest;

public class TriggerRecurringWorkerJobCommandHandler(IBackgroundJobMonitor monitor) : IRequestHandler<TriggerRecurringWorkerJobCommand>
{
    public Task Handle(TriggerRecurringWorkerJobCommand request, CancellationToken cancellationToken)
        => monitor.TriggerRecurring(request.Id) ? Task.CompletedTask : throw new NotFoundException("RecurringWorkerJob", request.Id);
}
