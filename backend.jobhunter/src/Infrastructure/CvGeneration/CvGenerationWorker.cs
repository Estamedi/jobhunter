using backend.jobhunter.Application.Common;
using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts;
using backend.jobhunter.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace backend.jobhunter.Infrastructure.CvGeneration;

// Writes Pending CV drafts one at a time. Woken by CvGenerationSignal when a draft is queued, and by a
// poll fallback that also covers restarts. Assumes a single backend instance, like CvUploadWorker.
public class CvGenerationWorker(
    IServiceScopeFactory scopeFactory, CvGenerationSignal signal, ILogger<CvGenerationWorker> logger) : BackgroundService
{
    // A draft is retried once after a restart in the middle of writing it, then marked Failed.
    public const int MaxAttempts = 2;
    public const string RestartMessage = "The server restarted while writing this CV. Try again.";
    public const string GenericFailureMessage = "Something went wrong while writing this CV. Try again.";

    private static readonly TimeSpan Poll = TimeSpan.FromSeconds(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await RecoverInterruptedAsync(stoppingToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Could not recover interrupted CV drafts.");
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
                logger.LogError(ex, "CV generation worker iteration failed.");
                await Task.Delay(Poll, stoppingToken);
            }
        }
    }

    // A draft left Running by a stopped server goes back in the queue, or fails after too many tries.
    public async Task RecoverInterruptedAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var running = context.CvDrafts.IgnoreQueryFilters().Where(d => d.Status == CvDraftStatus.Running);
        await running.Where(d => d.GenerationAttempts >= MaxAttempts).ExecuteUpdateAsync(
            s => s.SetProperty(d => d.Status, CvDraftStatus.Failed).SetProperty(d => d.GenerationError, RestartMessage),
            cancellationToken);
        await running.ExecuteUpdateAsync(s => s.SetProperty(d => d.Status, CvDraftStatus.Pending), cancellationToken);
    }

    // Takes the oldest Pending draft and writes it. Returns false when there is nothing waiting.
    public async Task<bool> ProcessNextAsync(CancellationToken cancellationToken)
    {
        int draftId;
        Guid ownerId;
        using (var scope = scopeFactory.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            var next = await context.CvDrafts.IgnoreQueryFilters().AsNoTracking()
                .Where(d => d.Status == CvDraftStatus.Pending)
                .OrderBy(d => d.Id)
                .Select(d => new { d.Id, d.OwnerId })
                .FirstOrDefaultAsync(cancellationToken);
            if (next is null) return false;

            // Claimed with one atomic update, so a draft is never written twice.
            var claimed = await context.CvDrafts.IgnoreQueryFilters()
                .Where(d => d.Id == next.Id && d.Status == CvDraftStatus.Pending)
                .ExecuteUpdateAsync(
                    s => s.SetProperty(d => d.Status, CvDraftStatus.Running)
                        .SetProperty(d => d.GenerationAttempts, d => d.GenerationAttempts + 1),
                    cancellationToken);
            if (claimed == 0) return true;

            draftId = next.Id;
            ownerId = next.OwnerId;
        }

        await WriteAsync(draftId, ownerId, cancellationToken);
        return true;
    }

    private async Task WriteAsync(int draftId, Guid ownerId, CancellationToken cancellationToken)
    {
        var status = CvDraftStatus.Completed;
        try
        {
            using var scope = scopeFactory.CreateScope();
            // Run as the draft's owner so the per-user data filters see the owner's profile.
            scope.ServiceProvider.GetRequiredService<UserOverride>().Id = ownerId.ToString();
            await scope.ServiceProvider.GetRequiredService<CvDraftGenerationService>().RunAsync(draftId, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // Shutting down: the draft stays Running and is put back in the queue on the next start.
            throw;
        }
        catch (Exception ex)
        {
            status = CvDraftStatus.Failed;
            // The AI exceptions already carry a message written for the user; nothing else may leak.
            var message = ex is AiServiceException ? ex.Message : GenericFailureMessage;
            logger.LogError(ex, "Writing CV draft {DraftId} failed.", draftId);
            await MarkFailedAsync(draftId, message, cancellationToken);
        }

        await NotifyAsync(ownerId, draftId, status, cancellationToken);
    }

    private async Task MarkFailedAsync(int draftId, string message, CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        // An update by id, so a draft deleted while it was being written is simply not found.
        await context.CvDrafts.IgnoreQueryFilters().Where(d => d.Id == draftId).ExecuteUpdateAsync(
            s => s.SetProperty(d => d.Status, CvDraftStatus.Failed)
                .SetProperty(d => d.GenerationError, message.Length <= 500 ? message : message[..500]),
            cancellationToken);
    }

    private async Task NotifyAsync(Guid ownerId, int draftId, CvDraftStatus status, CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var notifier = scope.ServiceProvider.GetService<ICvGenerationNotifier>();
            if (notifier is not null)
            {
                await notifier.NotifyAsync(ownerId.ToString(), draftId, status.ToString(), cancellationToken);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // The live push is a convenience; the UI also polls, so a failed push must not fail the draft.
            logger.LogWarning(ex, "Could not notify the owner of CV draft {DraftId}.", draftId);
        }
    }
}
