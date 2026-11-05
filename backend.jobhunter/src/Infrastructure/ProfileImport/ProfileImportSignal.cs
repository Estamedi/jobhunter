using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Infrastructure.BackgroundJobs;

namespace backend.jobhunter.Infrastructure.ProfileImport;

// Wakes the background job that reads pending CV imports.
public sealed class ProfileImportSignal(JobEnqueuer jobs) : IProfileImportSignal
{
    public void Notify() => jobs.EnqueueDrainIfIdle<ProfileImportWorker>(JobQueues.ProfileImport, w => w.DrainAsync(CancellationToken.None));
}
