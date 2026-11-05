using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Events;

namespace backend.jobhunter.Application.Notifications.EventHandlers;

// Turns an EmailRequestedEvent into a queued email; EmailWorker does the SMTP send in the background.
public class EmailRequestedEventHandler(IEmailQueue queue) : INotificationHandler<EmailRequestedEvent>
{
    public Task Handle(EmailRequestedEvent notification, CancellationToken cancellationToken)
    {
        queue.Enqueue(notification.To, notification.Subject, notification.HtmlMessage, notification.FromEmail, notification.FromName);
        return Task.CompletedTask;
    }
}
