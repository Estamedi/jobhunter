using backend.jobhunter.Application.CandidateProfiles;
using backend.jobhunter.Application.Common;
using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace backend.jobhunter.Infrastructure.ProfileImport;

// Reads Pending CV imports one at a time. Woken by ProfileImportSignal when a job is queued, and by a poll
// fallback that also covers restarts. Assumes a single backend instance, like the other workers.
public class ProfileImportWorker(
    IServiceScopeFactory scopeFactory, ProfileImportSignal signal, ILogger<ProfileImportWorker> logger) : BackgroundService
{
    // A job is retried once after a restart in the middle of reading it, then marked Failed.
    public const int MaxAttempts = 2;
    public const string RestartMessage = "The server restarted while reading this CV. Try again.";

    private static readonly TimeSpan Poll = TimeSpan.FromSeconds(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await RecoverInterruptedAsync(stoppingToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Could not recover interrupted CV imports.");
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await signal.WaitAsync(Poll, stoppingToken);
                while (await ProcessNextAsync(stoppingToken)) { }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "CV import worker iteration failed.");
                await Task.Delay(Poll, stoppingToken);
            }
        }
    }

    // A job left Running by a stopped server goes back in the queue, or fails after too many tries.
    public async Task RecoverInterruptedAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var running = context.ProfileImportJobs.IgnoreQueryFilters().Where(j => j.Status == ProfileImportStatus.Running);
        await running.Where(j => j.Attempts >= MaxAttempts).ExecuteUpdateAsync(
            s => s.SetProperty(j => j.Status, ProfileImportStatus.Failed).SetProperty(j => j.Error, RestartMessage),
            cancellationToken);
        await running.ExecuteUpdateAsync(s => s.SetProperty(j => j.Status, ProfileImportStatus.Pending), cancellationToken);
    }

    // Takes the oldest Pending job and reads it. Returns false when there is nothing waiting.
    public async Task<bool> ProcessNextAsync(CancellationToken cancellationToken)
    {
        int jobId;
        Guid ownerId;
        using (var scope = scopeFactory.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            var next = await context.ProfileImportJobs.IgnoreQueryFilters().AsNoTracking()
                .Where(j => j.Status == ProfileImportStatus.Pending)
                .OrderBy(j => j.Id)
                .Select(j => new { j.Id, j.OwnerId })
                .FirstOrDefaultAsync(cancellationToken);
            if (next is null) return false;

            // Claimed with one atomic update, so a job is never read twice.
            var claimed = await context.ProfileImportJobs.IgnoreQueryFilters()
                .Where(j => j.Id == next.Id && j.Status == ProfileImportStatus.Pending)
                .ExecuteUpdateAsync(
                    s => s.SetProperty(j => j.Status, ProfileImportStatus.Running)
                        .SetProperty(j => j.Attempts, j => j.Attempts + 1),
                    cancellationToken);
            if (claimed == 0) return true;

            jobId = next.Id;
            ownerId = next.OwnerId;
        }

        await ReadAsync(jobId, ownerId, cancellationToken);
        return true;
    }

    private async Task ReadAsync(int jobId, Guid ownerId, CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            // Run as the job's owner so the per-user data filters see the owner's CV.
            scope.ServiceProvider.GetRequiredService<UserOverride>().Id = ownerId.ToString();
            await scope.ServiceProvider.GetRequiredService<ProfileImportService>().RunAsync(jobId, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // Shutting down: the job stays Running and is put back in the queue on the next start.
            throw;
        }
        catch (Exception ex)
        {
            // These three carry a message written for the user; nothing else may leak.
            var message = ex is ProfileImportFailedException or AiServiceException
                ? ex.Message
                : ProfileImportService.UnreadableMessage;
            logger.LogError(ex, "Reading CV import {JobId} failed.", jobId);
            await MarkFailedAsync(jobId, message, cancellationToken);
        }
    }

    private async Task MarkFailedAsync(int jobId, string message, CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        // An update by id, so a job whose CV was deleted while it was being read is simply not found.
        await context.ProfileImportJobs.IgnoreQueryFilters().Where(j => j.Id == jobId).ExecuteUpdateAsync(
            s => s.SetProperty(j => j.Status, ProfileImportStatus.Failed)
                .SetProperty(j => j.Error, message.Length <= 500 ? message : message[..500]),
            cancellationToken);
    }
}
