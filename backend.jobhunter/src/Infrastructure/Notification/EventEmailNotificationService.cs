using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Events;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace backend.jobhunter.Infrastructure.Notification;

// What the rest of the app sends email through. It raises an EmailRequestedEvent and returns; the event
// handler queues the message and EmailWorker sends it, so SMTP never slows or breaks the request.
// A singleton (Identity builds its email sender from the root provider), so it publishes from its own scope.
public class EventEmailNotificationService(IServiceScopeFactory scopeFactory) : IEmailNotificationService
{
    public Task SendEmailAsync(string email, string subject, string htmlMessage) =>
        PublishAsync(new EmailRequestedEvent(email, subject, htmlMessage));

    public Task SendEmailAsync(string email, string subject, string htmlMessage, string fromEmail, string fromName) =>
        PublishAsync(new EmailRequestedEvent(email, subject, htmlMessage, fromEmail, fromName));

    private async Task PublishAsync(EmailRequestedEvent notification)
    {
        using var scope = scopeFactory.CreateScope();
        await scope.ServiceProvider.GetRequiredService<IPublisher>().Publish(notification);
    }
}
