using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Infrastructure.CvGeneration;
using backend.jobhunter.Infrastructure.Files;
using backend.jobhunter.Infrastructure.ProfileImport;
using Hangfire;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace backend.jobhunter.Infrastructure.BackgroundJobs;

// At start: puts work a stopped server left half done back in its queue, registers the five-minute polls
// that cover missed wake-ups and restarts, and wakes each worker once.
public class BackgroundJobsStartup(
    IServiceProvider services, IRecurringJobManager recurring, ILogger<BackgroundJobsStartup> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            using (var scope = services.CreateScope())
            {
                await scope.ServiceProvider.GetRequiredService<CvGenerationWorker>().RecoverInterruptedAsync(cancellationToken);
                await scope.ServiceProvider.GetRequiredService<ProfileImportWorker>().RecoverInterruptedAsync(cancellationToken);
            }

            recurring.AddOrUpdate<CvGenerationWorker>("cv-generation-poll", JobQueues.CvGeneration, w => w.DrainAsync(CancellationToken.None), "*/5 * * * *");
            recurring.AddOrUpdate<ProfileImportWorker>("profile-import-poll", JobQueues.ProfileImport, w => w.DrainAsync(CancellationToken.None), "*/5 * * * *");
            // The S3 upload worker (and so its poll) exists only when S3 storage is configured.
            if (services.GetService<ICvRemoteSync>() is not null)
                recurring.AddOrUpdate<CvUploadWorker>("cv-upload-poll", JobQueues.CvUpload, w => w.RunAsync(CancellationToken.None), "*/5 * * * *");
            else
                recurring.RemoveIfExists("cv-upload-poll");

            services.GetRequiredService<ICvGenerationSignal>().Notify();
            services.GetRequiredService<IProfileImportSignal>().Notify();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Could not set up the background jobs.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
