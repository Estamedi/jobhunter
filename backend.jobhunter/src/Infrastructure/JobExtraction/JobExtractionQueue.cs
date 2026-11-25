using System.Security.Cryptography;
using System.Text;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Infrastructure.BackgroundJobs;
using Hangfire;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace backend.jobhunter.Infrastructure.JobExtraction;

// Per-user, per-URL extraction state kept in memory (Hangfire runs in this same process). The request that
// starts an extraction and any repeat request for the same page all wait on the same task, so only one AI call
// is made. Finished results are remembered for a few minutes; failures are dropped so a retry starts fresh.
public sealed class JobExtractionQueue(IMemoryCache cache, IBackgroundJobClient jobs) : IJobExtractionQueue
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);
    private static readonly object Gate = new();

    internal sealed class Entry
    {
        public JobPageContent? Page;
        public readonly TaskCompletionSource<ExtractedJobDto> Result = new(TaskCreationOptions.RunContinuationsAsynchronously);
    }

    public static string Key(string userId, string url)
        => $"job-extract:{userId}:{Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(url)))}";

    public async Task<ExtractedJobDto> ExtractAsync(string userId, JobPageContent page, CancellationToken cancellationToken)
    {
        var key = Key(userId, page.Url);
        Entry entry;
        var started = false;
        lock (Gate)
        {
            if (!cache.TryGetValue(key, out Entry? current) || current is null)
            {
                current = new Entry { Page = page };
                cache.Set(key, current, Lifetime);
                started = true;
            }
            entry = current;
        }

        if (started) jobs.Enqueue<JobExtractionWorker>(w => w.RunAsync(key, CancellationToken.None));
        return await entry.Result.Task.WaitAsync(cancellationToken);
    }

    public JobExtractionStatusDto? Get(string userId, string url)
    {
        if (!cache.TryGetValue(Key(userId, url), out Entry? e) || e is null) return null;
        var task = e.Result.Task;
        if (!task.IsCompleted) return new JobExtractionStatusDto { Status = "Processing" };
        return task.IsCompletedSuccessfully
            ? new JobExtractionStatusDto { Status = "Completed", Job = task.Result }
            : new JobExtractionStatusDto { Status = "Failed", Error = "AI extraction failed. Try again." };
    }

    internal Entry? Find(string key) => cache.TryGetValue(key, out Entry? e) ? e : null;

    internal void Complete(Entry entry, ExtractedJobDto job)
    {
        entry.Page = null;
        entry.Result.TrySetResult(job);
    }

    internal void Fail(string key, Entry entry, Exception ex)
    {
        entry.Page = null;
        cache.Remove(key);
        entry.Result.TrySetException(ex);
    }
}

[Queue(JobQueues.JobExtraction)]
[AutomaticRetry(Attempts = 0)]
public class JobExtractionWorker(JobExtractionQueue queue, IJobExtractionAiService ai, ILogger<JobExtractionWorker> logger)
{
    public async Task RunAsync(string key, CancellationToken cancellationToken)
    {
        var entry = queue.Find(key);
        if (entry?.Page is null) return;
        try
        {
            queue.Complete(entry, await ai.ExtractAsync(entry.Page, cancellationToken));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Job extraction failed.");
            queue.Fail(key, entry, ex);
        }
    }
}
