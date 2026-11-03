using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Infrastructure.Files;

// Uploads Pending CV files from the local cache to S3. Woken by CvUploadRequestedEvent and by a
// poll fallback (covers restarts and retries). Assumes a single backend instance.
public class CvUploadWorker : BackgroundService
{
    // The event fires before the row is committed; give the save a moment to finish.
    private static readonly TimeSpan CommitGrace = TimeSpan.FromMilliseconds(500);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IServiceProvider _services;
    private readonly CvUploadSignal _signal;
    private readonly IOptions<FileStorageOptions> _options;
    private readonly TimeProvider _clock;
    private readonly ILogger<CvUploadWorker> _logger;
    private ICvRemoteSync? _remote;

    public CvUploadWorker(
        IServiceScopeFactory scopeFactory,
        IServiceProvider services,
        CvUploadSignal signal,
        IOptions<FileStorageOptions> options,
        TimeProvider clock,
        ILogger<CvUploadWorker> logger,
        ICvRemoteSync? remote = null)
    {
        _scopeFactory = scopeFactory;
        _services = services;
        _signal = signal;
        _options = options;
        _clock = clock;
        _logger = logger;
        _remote = remote;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            // Resolved lazily so an unconfigured S3 (empty bucket) disables the worker instead of failing startup.
            _remote ??= _services.GetRequiredService<ICvRemoteSync>();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "S3 file storage is not configured; the CV upload worker is disabled.");
            return;
        }

        var retry = _options.Value.Retry;
        var poll = TimeSpan.FromSeconds(Math.Max(1, retry.PollSeconds));

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (await _signal.WaitAsync(poll, stoppingToken))
                {
                    await Task.Delay(CommitGrace, stoppingToken);
                }

                await ProcessPendingAsync(retry, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CV upload worker iteration failed.");
                await Task.Delay(poll, stoppingToken);
            }
        }
    }

    public async Task ProcessPendingAsync(UploadRetryOptions retry, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var now = _clock.GetUtcNow();

        var candidates = await context.Cvs
            .IgnoreQueryFilters()
            .Where(c => c.UploadStatus == CvUploadStatus.Pending)
            .OrderBy(c => c.Id)
            .Take(retry.BatchSize * 5)
            .ToListAsync(cancellationToken);

        var due = candidates.Where(c => IsDue(c.UploadAttempts, c.LastUploadAttemptAt, now, retry)).Take(retry.BatchSize).ToList();

        foreach (var cv in due)
        {
            cancellationToken.ThrowIfCancellationRequested();
            await UploadOneAsync(context, cv, retry, cancellationToken);
        }
    }

    private async Task UploadOneAsync(IApplicationDbContext context, Domain.Entities.Cv cv, UploadRetryOptions retry, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _remote!.SyncToRemoteAsync(cv.StorageKey, cancellationToken);
            cv.UploadStatus = result == RemoteSyncResult.Uploaded ? CvUploadStatus.Uploaded : CvUploadStatus.Failed;
            cv.LastUploadError = result == RemoteSyncResult.Missing ? "File is not in the local cache or S3." : null;
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
        {
            cv.UploadAttempts++;
            cv.LastUploadError = Truncate(ex.Message);
            cv.UploadStatus = cv.UploadAttempts >= retry.MaxAttempts ? CvUploadStatus.Failed : CvUploadStatus.Pending;
            _logger.LogWarning(ex, "S3 upload failed for CV {CvId} ({StorageKey}), attempt {Attempt}.", cv.Id, cv.StorageKey, cv.UploadAttempts);
        }

        cv.LastUploadAttemptAt = _clock.GetUtcNow();

        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            // The CV was deleted while uploading: remove the object that was just written.
            if (cv.UploadStatus == CvUploadStatus.Uploaded)
            {
                await _remote!.DeleteRemoteAsync(cv.StorageKey, cancellationToken);
            }
        }
    }

    public static bool IsDue(int attempts, DateTimeOffset? lastAttemptAt, DateTimeOffset now, UploadRetryOptions retry)
    {
        if (attempts == 0 || lastAttemptAt is null)
        {
            return true;
        }

        var seconds = Math.Min(retry.MaxDelaySeconds, retry.BaseDelaySeconds * Math.Pow(2, attempts - 1));
        return now >= lastAttemptAt.Value.AddSeconds(seconds);
    }

    private static string Truncate(string message) => message.Length <= 500 ? message : message[..500];
}
