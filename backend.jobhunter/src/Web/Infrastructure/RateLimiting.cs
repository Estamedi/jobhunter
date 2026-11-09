using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;

namespace backend.jobhunter.Web.Infrastructure;

/// <summary>
/// Two kinds of abuse are limited: credential/email endpoints (per client IP) and the paid AI
/// endpoints (per signed-in user, as a short burst limit plus a daily quota). Limits are read from
/// the "RateLimiting" configuration section so they can be tuned per environment.
/// </summary>
public static class RateLimiting
{
    private static readonly string[] AuthPaths =
    [
        "/api/Users/login",
        "/api/Users/register",
        "/api/Users/forgotPassword",
        "/api/Users/resetPassword",
        "/api/Users/resendConfirmationEmail",
        "/api/Users/google-login",
        // Public website form: limited per IP like the sign-in endpoints so it cannot be used to flood the leads list.
        "/api/Consultations",
    ];

    public static void AddAppRateLimiting(this IHostApplicationBuilder builder)
    {
        var section = builder.Configuration.GetSection("RateLimiting");
        var authPerMinute = section.GetValue("AuthPerMinute", 10);
        var aiPerMinute = section.GetValue("AiPerMinute", 10);
        var aiPerDay = section.GetValue("AiPerDay", 100);

        builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            // The API runs behind a reverse proxy; without this every client shares the proxy's IP.
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });

        builder.Services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                var retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var wait) ? wait : (TimeSpan?)null;
                await WriteRejectionAsync(context.HttpContext, retryAfter, cancellationToken);
            };

            options.GlobalLimiter = PartitionedRateLimiter.CreateChained(
                PartitionedRateLimiter.Create<HttpContext, string>(context =>
                    IsAuthEndpoint(context)
                        ? RateLimitPartition.GetFixedWindowLimiter($"auth:{ClientIp(context)}", _ => FixedWindow(authPerMinute, TimeSpan.FromMinutes(1)))
                        : RateLimitPartition.GetNoLimiter("auth-none")),
                PartitionedRateLimiter.Create<HttpContext, string>(context =>
                    IsAiEndpoint(context)
                        ? RateLimitPartition.GetFixedWindowLimiter($"ai-min:{ClientKey(context)}", _ => FixedWindow(aiPerMinute, TimeSpan.FromMinutes(1)))
                        : RateLimitPartition.GetNoLimiter("ai-min-none")),
                PartitionedRateLimiter.Create<HttpContext, string>(context =>
                    IsAiEndpoint(context)
                        ? RateLimitPartition.GetFixedWindowLimiter($"ai-day:{ClientKey(context)}", _ => FixedWindow(aiPerDay, TimeSpan.FromDays(1)))
                        : RateLimitPartition.GetNoLimiter("ai-day-none")));
        });
    }

    // A 429 with a plain explanation and, when the limiter knows it, how long to wait (also in Retry-After).
    public static async Task WriteRejectionAsync(HttpContext context, TimeSpan? retryAfter, CancellationToken cancellationToken)
    {
        context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        if (retryAfter is { } wait)
        {
            context.Response.Headers.RetryAfter = Math.Max(1, (int)Math.Ceiling(wait.TotalSeconds)).ToString();
        }

        await context.Response.WriteAsJsonAsync(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Too many requests",
            Detail = RejectionMessage(IsAuthEndpoint(context), retryAfter),
        }, options: null, contentType: "application/problem+json", cancellationToken);
    }

    // The size of the wait tells which limit was hit: about a minute is the burst limit, hours is the daily quota.
    public static string RejectionMessage(bool authEndpoint, TimeSpan? retryAfter)
    {
        if (authEndpoint) return $"Too many sign-in attempts. Try again {When(retryAfter)}.";
        if (retryAfter is { } wait && wait > TimeSpan.FromMinutes(5))
        {
            return $"You have used today's AI requests. Try again {When(retryAfter)}.";
        }
        return $"You are sending AI requests too fast. Try again {When(retryAfter)}.";
    }

    private static string When(TimeSpan? retryAfter)
    {
        if (retryAfter is not { } wait) return "later";
        if (wait < TimeSpan.FromSeconds(90)) return $"in {Math.Max(1, (int)Math.Ceiling(wait.TotalSeconds))} seconds";
        if (wait < TimeSpan.FromHours(2)) return $"in {(int)Math.Ceiling(wait.TotalMinutes)} minutes";
        return $"in about {(int)Math.Ceiling(wait.TotalHours)} hours";
    }

    private static FixedWindowRateLimiterOptions FixedWindow(int permits, TimeSpan window) => new()
    {
        PermitLimit = permits,
        Window = window,
        QueueLimit = 0,
    };

    private static bool IsAuthEndpoint(HttpContext context) =>
        HttpMethods.IsPost(context.Request.Method)
        && AuthPaths.Any(path => context.Request.Path.Equals(path, StringComparison.OrdinalIgnoreCase));

    private static bool IsAiEndpoint(HttpContext context)
    {
        var path = context.Request.Path;

        return HttpMethods.IsPost(context.Request.Method)
            && (path.StartsWithSegments("/api/JobExtraction", StringComparison.OrdinalIgnoreCase)
                || path.StartsWithSegments("/api/CvGeneration", StringComparison.OrdinalIgnoreCase)
                || path.StartsWithSegments("/api/CandidateProfiles/import", StringComparison.OrdinalIgnoreCase)
                || path.StartsWithSegments("/api/CandidateProfiles/import-jobs", StringComparison.OrdinalIgnoreCase));
    }

    private static string ClientIp(HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    // Requests that reach the rate limiter are already authenticated (UseAuthentication runs first),
    // so a missing user id falls back to the IP.
    private static string ClientKey(HttpContext context) =>
        context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? ClientIp(context);
}
