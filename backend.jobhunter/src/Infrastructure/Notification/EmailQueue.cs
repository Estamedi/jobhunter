using backend.jobhunter.Application.Common.Interfaces;
using Hangfire;

namespace backend.jobhunter.Infrastructure.Notification;

// Hands each email to a Hangfire job, so it is stored in the database: it survives a restart and an
// administrator can see it in the Workers panel.
public class EmailQueue(IBackgroundJobClient client) : IEmailQueue
{
    public void Enqueue(string to, string subject, string htmlMessage, string? fromEmail = null, string? fromName = null) =>
        client.Enqueue<EmailWorker>(w => w.SendAsync(to, subject, htmlMessage, fromEmail, fromName));
}
