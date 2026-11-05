using System.Diagnostics;
using System.Text.Json;
using backend.jobhunter.Application.Common.Interfaces;
using ValidationException = backend.jobhunter.Application.Common.Exceptions.ValidationException;

namespace backend.jobhunter.Application.Common.Behaviours;

/// <summary>
/// Records every command (a write action) in the audit log: who, what, whether it worked and, if not, why.
/// Queries are not recorded; the UI polls some of them every second. The row is saved in its own scope so a
/// failed command's half-done changes are never saved with it, and a failure to audit never fails the request.
/// </summary>
public class AuditBehaviour<TRequest, TResponse>(
    IUser user, AuditLogWriter writer) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private const string CommandSuffix = "Command";

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var name = typeof(TRequest).Name;
        if (!name.EndsWith(CommandSuffix, StringComparison.Ordinal))
            return await next();

        var timer = Stopwatch.StartNew();
        try
        {
            var response = await next();
            await WriteAsync(request, name, succeeded: true, error: null, timer.ElapsedMilliseconds);
            return response;
        }
        catch (Exception ex)
        {
            await WriteAsync(request, name, succeeded: false, error: Describe(ex), timer.ElapsedMilliseconds);
            throw;
        }
    }

    private static string Describe(Exception ex) => ex switch
    {
        ValidationException ve => JsonSerializer.Serialize(ve.Errors),
        _ => $"{ex.GetType().Name}: {ex.Message}",
    };

    private Task WriteAsync(TRequest request, string name, bool succeeded, string? error, long elapsedMs) =>
        writer.WriteAsync(user.Id, null, name[..^CommandSuffix.Length], AuditRedactor.Serialize(request), succeeded, error, elapsedMs);
}
