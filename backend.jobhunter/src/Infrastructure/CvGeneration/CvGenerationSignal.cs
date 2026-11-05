using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Infrastructure.BackgroundJobs;

namespace backend.jobhunter.Infrastructure.CvGeneration;

// Wakes the background job that writes pending CV drafts.
public sealed class CvGenerationSignal(JobEnqueuer jobs) : ICvGenerationSignal
{
    public void Notify() => jobs.EnqueueDrainIfIdle<CvGenerationWorker>(JobQueues.CvGeneration, w => w.DrainAsync(CancellationToken.None));
}
