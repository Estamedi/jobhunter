using System.Net;
using System.Net.Mail;
using backend.jobhunter.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Infrastructure.Notification;

public class EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger) : IEmailNotificationService
{
    private readonly ILogger<EmailService> _logger = logger;
    private readonly EmailSettings _emailSettings = emailSettings.Value;

    public async Task SendEmailAsync(string email, string subject, string htmlMessage)
    {
        await SendEmailAsync(email, subject, htmlMessage, _emailSettings.FromEmail, _emailSettings.FromName);
    }

    public async Task SendEmailAsync(string email, string subject, string htmlMessage, string fromEmail, string fromName)
    {
        _logger.LogInformation("Attempting to send email to {Email} with subject {Subject}. Using SMTP Host: {Host}, Port: {Port}, SSL: {EnableSSL}, From: {FromEmail}",
            email, subject, _emailSettings.Host, _emailSettings.Port, _emailSettings.EnableSSL, fromEmail);

        try
        {
            var mail = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = subject,
                Body = htmlMessage,
                IsBodyHtml = true
            };
            mail.To.Add(new MailAddress(email));

            using var client = new SmtpClient(_emailSettings.Host, _emailSettings.Port)
            {
                Credentials = new NetworkCredential(_emailSettings.UserName, _emailSettings.Password),
                EnableSsl = _emailSettings.EnableSSL
            };

            await client.SendMailAsync(mail);
            _logger.LogInformation("Successfully sent email to {Email} with subject {Subject} from {FromEmail}", email, subject, fromEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email} with subject {Subject}. Error: {ErrorMessage}", email, subject, ex.Message);
            throw;
        }
    }
}
