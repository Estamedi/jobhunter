using System.Linq.Expressions;
using Hangfire;

namespace backend.jobhunter.Infrastructure.BackgroundJobs;

// Wakes a "drain the database queue" job. The work itself lives in database status columns, so a job that is
// already waiting in the queue will find the new item too and a second one would only add noise.
public class JobEnqueuer(IBackgroundJobClient client, JobStorage storage)
{
    public void EnqueueDrainIfIdle<T>(string queue, Expression<Func<T, Task>> drain)
    {
        try
        {
            if (storage.GetMonitoringApi().EnqueuedCount(queue) > 0) return;
        }
        catch
        {
            // Cannot tell: enqueue anyway; a duplicate drain finds nothing to do.
        }

        client.Enqueue(drain);
    }
}
