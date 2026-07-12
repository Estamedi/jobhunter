using backend.jobhunter.Application.Common.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace backend.jobhunter.Infrastructure.Identity;

public class IdentityEmailSender(IEmailNotificationService emailNotificationService) : IEmailSender<ApplicationUser>
{
    private readonly IEmailNotificationService _emailNotificationService = emailNotificationService;

    public Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink)
    {
        return _emailNotificationService.SendEmailAsync(
            email,
            "Confirm your JobHunter account",
            $"<p>Welcome to JobHunter! Please confirm your account by <a href='{confirmationLink}'>clicking here</a>.</p>");
    }

    public Task SendPasswordResetLinkAsync(ApplicationUser user, string email, string resetLink)
    {
        return _emailNotificationService.SendEmailAsync(
            email,
            "Reset your JobHunter password",
            $"<p>Please reset your password by <a href='{resetLink}'>clicking here</a>.</p>");
    }

    public Task SendPasswordResetCodeAsync(ApplicationUser user, string email, string resetCode)
    {
        return _emailNotificationService.SendEmailAsync(
            email,
            "Your JobHunter password reset code",
            $"<p>Your password reset code is: <strong>{resetCode}</strong></p>");
    }
}
