using System.Text.Json;
using System.Threading.RateLimiting;
using backend.jobhunter.Web.Infrastructure;
using Microsoft.AspNetCore.Http;

namespace backend.jobhunter.Application.FunctionalTests.CvGeneration;

public class RateLimitRejectionTests
{
    [TestCase(30, "too fast. Try again in 30 seconds")]
    [TestCase(61, "too fast. Try again in 61 seconds")]
    [TestCase(150, "too fast. Try again in 3 minutes")]
    [TestCase(3 * 3600, "used today's AI requests. Try again in about 3 hours")]
    public void ShouldExplainWhichAiLimitWasHitAndWhenToTryAgain(int seconds, string expected)
        => RateLimiting.RejectionMessage(authEndpoint: false, TimeSpan.FromSeconds(seconds)).ShouldContain(expected);

    [Test]
    public void ShouldSayLaterWhenTheWaitIsUnknownAndHaveASeparateSignInMessage()
    {
        RateLimiting.RejectionMessage(false, null).ShouldBe("You are sending AI requests too fast. Try again later.");
        RateLimiting.RejectionMessage(true, TimeSpan.FromSeconds(40)).ShouldBe("Too many sign-in attempts. Try again in 40 seconds.");
    }

    [Test]
    public async Task ShouldWriteA429WithProblemDetailsAndARetryAfterHeader()
    {
        var context = new DefaultHttpContext();
        context.Request.Method = "POST";
        context.Request.Path = "/api/CvGeneration";
        context.Response.Body = new MemoryStream();

        await RateLimiting.WriteRejectionAsync(context, TimeSpan.FromSeconds(42), default);

        context.Response.StatusCode.ShouldBe(429);
        context.Response.Headers.RetryAfter.ToString().ShouldBe("42");
        context.Response.ContentType.ShouldStartWith("application/problem+json");
        context.Response.Body.Position = 0;
        var body = await JsonDocument.ParseAsync(context.Response.Body);
        body.RootElement.GetProperty("status").GetInt32().ShouldBe(429);
        body.RootElement.GetProperty("detail").GetString()!.ShouldContain("Try again in 42 seconds");
    }

    [Test]
    public async Task ShouldWriteTheSignInMessageForALoginRequestAndNoHeaderWithoutAWait()
    {
        var context = new DefaultHttpContext();
        context.Request.Method = "POST";
        context.Request.Path = "/api/Users/login";
        context.Response.Body = new MemoryStream();

        await RateLimiting.WriteRejectionAsync(context, null, default);

        context.Response.Headers.ContainsKey("Retry-After").ShouldBeFalse();
        context.Response.Body.Position = 0;
        var body = await JsonDocument.ParseAsync(context.Response.Body);
        body.RootElement.GetProperty("detail").GetString().ShouldBe("Too many sign-in attempts. Try again later.");
    }

    // The limiter in the app is a chain of fixed windows. Its rejected lease has to carry the wait, or the
    // handler would always say "later".
    [Test]
    public void ShouldCarryTheWaitOnTheRejectedLeaseOfAChainedFixedWindowLimiter()
    {
        FixedWindowRateLimiterOptions Window() => new() { PermitLimit = 1, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 };
        using var limiter = PartitionedRateLimiter.CreateChained(
            PartitionedRateLimiter.Create<string, string>(_ => RateLimitPartition.GetFixedWindowLimiter("a", _ => Window())),
            PartitionedRateLimiter.Create<string, string>(_ => RateLimitPartition.GetNoLimiter("b")));

        using var first = limiter.AttemptAcquire("x");
        using var second = limiter.AttemptAcquire("x");

        first.IsAcquired.ShouldBeTrue();
        second.IsAcquired.ShouldBeFalse();
        second.TryGetMetadata(MetadataName.RetryAfter, out var wait).ShouldBeTrue();
        wait.ShouldBeGreaterThan(TimeSpan.Zero);
        wait.ShouldBeLessThanOrEqualTo(TimeSpan.FromMinutes(1));
    }
}
