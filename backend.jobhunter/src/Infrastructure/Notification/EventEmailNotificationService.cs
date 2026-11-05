using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Events;
using MediatR;

namespace backend.jobhunter.Infrastructure.Notification;

// What the rest of the app sends email through. It raises an EmailRequestedEvent and returns; the event
// handler queues the message and EmailWorker sends it, so SMTP never slows or breaks the request.
public class EventEmailNotificationService(IPublisher publisher) : IEmailNotificationService
{
    public Task SendEmailAsync(string email, string subject, string htmlMessage) =>
        publisher.Publish(new EmailRequestedEvent(email, subject, htmlMessage));

    public Task SendEmailAsync(string email, string subject, string htmlMessage, string fromEmail, string fromName) =>
        publisher.Publish(new EmailRequestedEvent(email, subject, htmlMessage, fromEmail, fromName));
}
