using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Entities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace backend.jobhunter.Application.Common.Behaviours;

/// <summary>
/// Saves one audit row in its own scope, so a failed request's half-done changes are never saved with it,
/// and never throws: a failure to audit must not fail the request.
/// </summary>
public class AuditLogWriter(IServiceScopeFactory scopeFactory, ILogger<AuditLogWriter> logger)
{
    public async Task WriteAsync(
        string? userId, string? userEmail, string action, string? payload, bool succeeded, string? error, long elapsedMs)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

            if (userEmail is null && userId is not null)
                userEmail = await scope.ServiceProvider.GetRequiredService<IIdentityService>().GetUserNameAsync(userId);

            context.AuditLogs.Add(new AuditLog
            {
                Timestamp = DateTimeOffset.UtcNow,
                UserId = userId,
                UserEmail = userEmail,
                Action = action,
                Payload = payload,
                Succeeded = succeeded,
                Error = error is { Length: > 4000 } ? error[..4000] : error,
                DurationMs = (int)Math.Min(elapsedMs, int.MaxValue),
            });
            await context.SaveChangesAsync(CancellationToken.None);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Could not write the audit log for {Action}", action);
        }
    }
}
