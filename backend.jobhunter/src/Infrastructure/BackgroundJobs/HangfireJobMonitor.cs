using System.Reflection;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Models;
using backend.jobhunter.Application.Workers;
using Hangfire;
using Hangfire.Common;
using Hangfire.Storage;
using Hangfire.Storage.Monitoring;

namespace backend.jobhunter.Infrastructure.BackgroundJobs;

// The administrator's view of Hangfire, built on its monitoring API (the same data its own dashboard shows).
public class HangfireJobMonitor(
    JobStorage storage, IBackgroundJobClient client, IRecurringJobManager recurring) : IBackgroundJobMonitor
{
    public WorkersOverviewDto GetOverview()
    {
        var api = storage.GetMonitoringApi();
        var s = api.GetStatistics();
        var stats = new WorkerStatsDto(
            s.Enqueued, s.Scheduled, s.Processing, s.Succeeded, s.Failed, s.Deleted, s.Servers, s.Recurring, s.Queues);

        // Hangfire lists only queues that have held a job; always show the configured ones.
        var known = api.Queues().ToDictionary(q => q.Name);
        var queues = JobQueues.All.Concat(known.Keys).Distinct()
            .Select(name => known.TryGetValue(name, out var q) ? new WorkerQueueDto(name, q.Length, q.Fetched ?? 0) : new WorkerQueueDto(name, 0, 0))
            .ToList();
        var servers = api.Servers().Select(v => new WorkerServerDto(
            v.Name, v.WorkersCount, v.Queues?.ToList() ?? [], v.StartedAt, v.Heartbeat)).ToList();

        using var connection = storage.GetConnection();
        var recurringJobs = connection.GetRecurringJobs().Select(r => new WorkerRecurringJobDto(
            r.Id, NameOf(r.Job), r.Cron, r.Queue, r.NextExecution, r.LastExecution, r.LastJobId, r.LastJobState, r.Error))
            .OrderBy(r => r.Id).ToList();

        return new WorkersOverviewDto(stats, queues, servers, recurringJobs, []);
    }

    public PaginatedList<WorkerJobDto> GetJobs(string state, int page, int pageSize)
    {
        var api = storage.GetMonitoringApi();
        var from = (page - 1) * pageSize;

        switch (state.ToLowerInvariant())
        {
            case "enqueued":
            {
                // Spread over every queue, so gather a page's worth from each and page the merged list.
                var all = api.Queues().SelectMany(q => api.EnqueuedJobs(q.Name, 0, from + pageSize)
                        .Select(j => new WorkerJobDto(j.Key, NameOf(j.Value.Job), q.Name, "Enqueued", ToUtc(j.Value.EnqueuedAt), null, null, null, null)))
                    .OrderBy(j => j.Since).ToList();
                var count = (int)api.Queues().Sum(q => q.Length);
                return new PaginatedList<WorkerJobDto>(all.Skip(from).Take(pageSize).ToList(), count, page, pageSize);
            }
            case "scheduled":
                return Page(api.ScheduledJobs(from, pageSize).Select(j => new WorkerJobDto(
                    j.Key, NameOf(j.Value.Job), QueueOf(j.Value.Job), "Scheduled", ToUtc(j.Value.EnqueueAt), null, null, null, null)),
                    api.ScheduledCount(), page, pageSize);
            case "processing":
                return Page(api.ProcessingJobs(from, pageSize).Select(j => new WorkerJobDto(
                    j.Key, NameOf(j.Value.Job), QueueOf(j.Value.Job), "Processing", ToUtc(j.Value.StartedAt), null, null, null, j.Value.ServerId)),
                    api.ProcessingCount(), page, pageSize);
            case "succeeded":
                return Page(api.SucceededJobs(from, pageSize).Select(j => new WorkerJobDto(
                    j.Key, NameOf(j.Value.Job), QueueOf(j.Value.Job), "Succeeded", ToUtc(j.Value.SucceededAt), null, null, null, null)),
                    api.SucceededListCount(), page, pageSize);
            case "failed":
                return Page(api.FailedJobs(from, pageSize).Select(j => new WorkerJobDto(
                    j.Key, NameOf(j.Value.Job), QueueOf(j.Value.Job), "Failed", ToUtc(j.Value.FailedAt), j.Value.Reason,
                    Truncate($"{j.Value.ExceptionType}: {j.Value.ExceptionMessage}"), null, null)),
                    api.FailedCount(), page, pageSize);
            case "deleted":
                return Page(api.DeletedJobs(from, pageSize).Select(j => new WorkerJobDto(
                    j.Key, NameOf(j.Value.Job), QueueOf(j.Value.Job), "Deleted", ToUtc(j.Value.DeletedAt), null, null, null, null)),
                    api.DeletedListCount(), page, pageSize);
            default:
                throw new ArgumentOutOfRangeException(nameof(state), state, "Unknown job state.");
        }
    }

    public WorkerJobDetailDto? GetJob(string id)
    {
        var details = storage.GetMonitoringApi().JobDetails(id);
        if (details is null) return null;

        var history = details.History.Select(h => new WorkerJobHistoryDto(h.StateName, h.CreatedAt, h.Reason)).ToList();
        return new WorkerJobDetailDto(
            id, NameOf(details.Job), QueueOf(details.Job), history.FirstOrDefault()?.State ?? "Unknown", details.CreatedAt, history);
    }

    public bool Requeue(string id) => storage.GetMonitoringApi().JobDetails(id) is not null && client.Requeue(id);

    public bool Delete(string id) => storage.GetMonitoringApi().JobDetails(id) is not null && client.Delete(id);

    public bool TriggerRecurring(string id)
    {
        using var connection = storage.GetConnection();
        if (connection.GetRecurringJobs().All(r => r.Id != id)) return false;
        recurring.Trigger(id);
        return true;
    }

    private static PaginatedList<WorkerJobDto> Page(IEnumerable<WorkerJobDto> items, long count, int page, int pageSize)
        => new(items.ToList(), (int)Math.Min(count, int.MaxValue), page, pageSize);

    private static string NameOf(Job? job) => job is null ? "(unknown job)" : $"{job.Type.Name}.{job.Method.Name}";

    private static string? QueueOf(Job? job) =>
        job?.Queue ?? job?.Method.GetCustomAttribute<Hangfire.QueueAttribute>()?.Queue
        ?? job?.Type.GetCustomAttribute<Hangfire.QueueAttribute>()?.Queue ?? "default";

    private static DateTime? ToUtc(DateTime? value) => value is null ? null : DateTime.SpecifyKind(value.Value, DateTimeKind.Utc);

    private static string Truncate(string text) => text.Length <= 500 ? text : text[..500];
}
