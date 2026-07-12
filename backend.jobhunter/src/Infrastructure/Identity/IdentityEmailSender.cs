using System.Net;
using backend.jobhunter.Application.Common.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace backend.jobhunter.Infrastructure.Identity;

public class IdentityEmailSender(IEmailNotificationService emailNotificationService, IConfiguration configuration) : IEmailSender<ApplicationUser>
{
    private readonly IEmailNotificationService _emailNotificationService = emailNotificationService;
    private readonly IConfiguration _configuration = configuration;

    public Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink)
    {
        var frontendLink = BuildFrontendLink("/confirm-email", confirmationLink);

        return _emailNotificationService.SendEmailAsync(
            email,
            "Confirm your JobHunter account",
            $"<p>Welcome to JobHunter! Please confirm your account by <a href='{WebUtility.HtmlEncode(frontendLink)}'>clicking here</a>.</p>");
    }

    // MapIdentityApi HTML-encodes the link before handing it to us (so '&' arrives as '&amp;');
    // decode it first or the query string splits on the wrong characters.
    private string BuildFrontendLink(string frontendPath, string backendLink)
    {
        var decodedLink = WebUtility.HtmlDecode(backendLink);
        var query = new Uri(decodedLink).Query;
        var webUrl = _configuration["Domain:WebUrl"] ?? "http://localhost:5173";

        return $"{webUrl.TrimEnd('/')}{frontendPath}{query}";
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
