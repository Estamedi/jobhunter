using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Infrastructure.BackgroundJobs;

namespace backend.jobhunter.Infrastructure.Files;

// Wakes the background job that uploads pending CVs to S3.
public sealed class CvUploadSignal(JobEnqueuer jobs) : ICvUploadSignal
{
    public void Notify() => jobs.EnqueueDrainIfIdle<CvUploadWorker>(JobQueues.CvUpload, w => w.RunAsync(CancellationToken.None));
}
