using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace backend.jobhunter.Infrastructure.Notification;

// Sends queued emails one by one. It uses the SMTP EmailService directly (not IEmailNotificationService,
// which is the queue). A failed send is logged and skipped so one bad message never stops the worker.
public class EmailWorker(EmailQueue queue, EmailService emailService, ILogger<EmailWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await foreach (var job in queue.ReadAllAsync(stoppingToken))
            {
                try
                {
                    if (job.FromEmail is not null)
                        await emailService.SendEmailAsync(job.To, job.Subject, job.HtmlMessage, job.FromEmail, job.FromName ?? string.Empty);
                    else
                        await emailService.SendEmailAsync(job.To, job.Subject, job.HtmlMessage);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    logger.LogError(ex, "Could not send email {Subject} to {To}.", job.Subject, job.To);
                }
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
    }
}
