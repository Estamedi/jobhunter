using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Infrastructure.Identity;
using Microsoft.Extensions.Configuration;
using Moq;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.Infrastructure;

public class IdentityEmailSenderTests
{
    private static IdentityEmailSender Sender(Mock<IEmailNotificationService> mail, string? webUrl = "https://app.example.com/")
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(webUrl is null ? [] : new Dictionary<string, string?> { ["Domain:WebUrl"] = webUrl })
            .Build();
        return new IdentityEmailSender(mail.Object, config);
    }

    [Test]
    public async Task ShouldEmailAFrontendResetLinkWithTheAddressAndToken()
    {
        var mail = new Mock<IEmailNotificationService>();
        string? to = null, subject = null, body = null;
        mail.Setup(m => m.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Callback<string, string, string>((t, s, b) => (to, subject, body) = (t, s, b))
            .Returns(Task.CompletedTask);

        await Sender(mail).SendPasswordResetCodeAsync(null!, "jane+test@example.com", "abc_DEF-123");

        to.ShouldBe("jane+test@example.com");
        subject.ShouldBe("Reset your JobHunter password");
        body!.ShouldContain("https://app.example.com/reset-password?email=jane%2Btest%40example.com&amp;code=abc_DEF-123");
        body!.ShouldNotContain("/api/");
    }

    [Test]
    public async Task ShouldFallBackToTheLocalFrontendWhenNoWebUrlIsConfigured()
    {
        var mail = new Mock<IEmailNotificationService>();
        string? body = null;
        mail.Setup(m => m.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Callback<string, string, string>((_, _, b) => body = b)
            .Returns(Task.CompletedTask);

        await Sender(mail, webUrl: null).SendPasswordResetCodeAsync(null!, "a@b.com", "tok");

        body!.ShouldContain("http://localhost:5173/reset-password?email=a%40b.com");
    }
}
