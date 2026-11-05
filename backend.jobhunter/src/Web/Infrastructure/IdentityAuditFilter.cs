using System.Diagnostics;
using System.Text.Json;
using backend.jobhunter.Application.Common.Behaviours;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Infrastructure;

/// <summary>
/// Audits the account endpoints that MapIdentityApi provides (sign-in, register, confirm email, password
/// reset). They never go through MediatR, so AuditBehaviour cannot see them. Records the email from the
/// request and the outcome; the password and codes in the request are never read.
/// </summary>
public static class IdentityAuditFilter
{
    private static readonly Dictionary<string, string> Audited = new(StringComparer.OrdinalIgnoreCase)
    {
        ["login"] = "Login",
        ["register"] = "Register",
        ["confirmEmail"] = "ConfirmEmail",
        ["resendConfirmationEmail"] = "ResendConfirmationEmail",
        ["forgotPassword"] = "ForgotPassword",
        ["resetPassword"] = "ResetPassword",
    };

    public static TBuilder AddIdentityAudit<TBuilder>(this TBuilder builder) where TBuilder : IEndpointConventionBuilder =>
        builder.AddEndpointFilter(async (context, next) =>
        {
            var segment = context.HttpContext.Request.Path.Value?.TrimEnd('/').Split('/').LastOrDefault();
            if (segment is null || !Audited.TryGetValue(segment, out var action))
                return await next(context);

            var timer = Stopwatch.StartNew();
            var result = await next(context);

            var email = context.Arguments.Select(EmailOf).FirstOrDefault(e => e is not null)
                ?? context.HttpContext.Request.Query["userId"].FirstOrDefault();
            var (succeeded, error) = Outcome(result);
            var payload = email is null ? null : JsonSerializer.Serialize(new { email });

            await context.HttpContext.RequestServices.GetRequiredService<AuditLogWriter>()
                .WriteAsync(null, email, action, payload, succeeded, error, timer.ElapsedMilliseconds);
            return result;
        });

    // Every request DTO of these endpoints that names an account has an Email property.
    private static string? EmailOf(object? argument) =>
        argument?.GetType().GetProperty("Email")?.GetValue(argument) as string;

    // Identity's handlers return a Results<...> union; the status lives on the result inside it.
    private static (bool Succeeded, string? Error) Outcome(object? result) =>
        Classify(result?.GetType().GetProperty("Result")?.GetValue(result) ?? result);

    private static (bool Succeeded, string? Error) Classify(object? result) => result switch
    {
        ProblemHttpResult problem => (false, problem.ProblemDetails.Detail ?? problem.ProblemDetails.Title),
        ValidationProblem validation => (false, JsonSerializer.Serialize(validation.ProblemDetails.Errors)),
        IStatusCodeHttpResult { StatusCode: >= 400 and var code } => (false, $"HTTP {code}"),
        _ => (true, null),
    };
}
