using backend.jobhunter.Infrastructure.BackgroundJobs;
using Hangfire;

namespace backend.jobhunter.Infrastructure.Notification;

// Sends one queued email, as a Hangfire job. It uses the SMTP EmailService directly (not IEmailNotificationService,
// which is the queue). A failed send is retried by Hangfire with growing delays, then left in the Failed list.
[Queue(JobQueues.Email)]
[AutomaticRetry(Attempts = 5, DelaysInSeconds = [30, 120, 600, 1800, 3600], OnAttemptsExceeded = AttemptsExceededAction.Fail)]
public class EmailWorker(EmailService emailService)
{
    // Returns 1 (one email handled) so the audit log records every send.
    public async Task<int> SendAsync(string to, string subject, string htmlMessage, string? fromEmail, string? fromName)
    {
        if (fromEmail is not null)
            await emailService.SendEmailAsync(to, subject, htmlMessage, fromEmail, fromName ?? string.Empty);
        else
            await emailService.SendEmailAsync(to, subject, htmlMessage);
        return 1;
    }
}
