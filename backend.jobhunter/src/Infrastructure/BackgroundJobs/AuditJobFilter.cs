using System.Diagnostics;
using System.Text.Json;
using backend.jobhunter.Application.Common.Behaviours;
using Hangfire.Common;
using Hangfire.Server;

namespace backend.jobhunter.Infrastructure.BackgroundJobs;

// Puts what the background jobs do in the audit log, next to what users do. A drain job that found nothing
// to do is skipped, or the once-a-minute polls would fill the log. Arguments are never recorded (an email
// job carries the message itself).
public class AuditJobFilter(AuditLogWriter writer) : JobFilterAttribute, IServerFilter
{
    private const string TimerKey = "audit-timer";

    public void OnPerforming(PerformingContext context) => context.Items[TimerKey] = Stopwatch.StartNew();

    public void OnPerformed(PerformedContext context)
    {
        var exception = context.Exception is { } ex && !context.ExceptionHandled ? ex : null;
        if (exception is OperationCanceledException) return; // shutting down; the job is retried

        var processed = context.Result as int?;
        if (exception is null && processed == 0) return;

        var elapsed = context.Items.TryGetValue(TimerKey, out var t) && t is Stopwatch sw ? sw.ElapsedMilliseconds : 0;
        var job = context.BackgroundJob.Job;
        var action = $"Job:{job.Type.Name}.{job.Method.Name}";
        var payload = JsonSerializer.Serialize(new { jobId = context.BackgroundJob.Id, processed });
        var error = exception is null ? null : $"{exception.GetType().Name}: {exception.Message}";

        writer.WriteAsync(null, "background-worker", action, payload, exception is null, error, elapsed)
            .GetAwaiter().GetResult();
    }
}
