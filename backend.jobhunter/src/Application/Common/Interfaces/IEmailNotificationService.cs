namespace backend.jobhunter.Application.Common.Interfaces;

public interface IEmailNotificationService
{
    Task SendEmailAsync(string email, string subject, string htmlMessage);
    Task SendEmailAsync(string email, string subject, string htmlMessage, string fromEmail, string fromName);
}
