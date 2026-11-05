using backend.jobhunter.Application.Common.Models;
using backend.jobhunter.Application.Workers;

namespace backend.jobhunter.Application.Common.Interfaces;

// Read and control access to the background job system, for the administrator's Workers panel.
public interface IBackgroundJobMonitor
{
    WorkersOverviewDto GetOverview();

    PaginatedList<WorkerJobDto> GetJobs(string state, int page, int pageSize);

    WorkerJobDetailDto? GetJob(string id);

    bool Requeue(string id);

    bool Delete(string id);

    bool TriggerRecurring(string id);
}
