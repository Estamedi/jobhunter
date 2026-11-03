using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Events;

namespace backend.jobhunter.Application.Cvs.EventHandlers;

public class CvUploadRequestedEventHandler(ICvUploadSignal signal) : INotificationHandler<CvUploadRequestedEvent>
{
    public Task Handle(CvUploadRequestedEvent notification, CancellationToken cancellationToken)
    {
        signal.Notify();
        return Task.CompletedTask;
    }
}
