namespace backend.jobhunter.Application.Workers;

public record WorkerStatsDto(
    long Enqueued, long Scheduled, long Processing, long Succeeded, long Failed, long Deleted,
    long Servers, long Recurring, long Queues);

public record WorkerQueueDto(string Name, long Length, long Fetched);

public record WorkerServerDto(
    string Name, int WorkerCount, IReadOnlyList<string> Queues, DateTime StartedAt, DateTime? Heartbeat);

public record WorkerRecurringJobDto(
    string Id, string? Name, string Cron, string? Queue, DateTime? NextExecution, DateTime? LastExecution,
    string? LastJobId, string? LastJobState, string? Error);

// How many items wait in each database-backed queue (the status columns the jobs work from).
public record WorkItemCountDto(string Queue, string Status, int Count);

public record WorkersOverviewDto(
    WorkerStatsDto Stats,
    IReadOnlyList<WorkerQueueDto> Queues,
    IReadOnlyList<WorkerServerDto> Servers,
    IReadOnlyList<WorkerRecurringJobDto> Recurring,
    IReadOnlyList<WorkItemCountDto> WorkItems);

public record WorkerJobDto(
    string Id, string Name, string? Queue, string State, DateTime? Since, string? Reason, string? Error, DateTime? CreatedAt,
    string? Server);

public record WorkerJobHistoryDto(string State, DateTime CreatedAt, string? Reason);

// No arguments are returned: an email job carries the message itself.
public record WorkerJobDetailDto(
    string Id, string Name, string? Queue, string State, DateTime? CreatedAt, IReadOnlyList<WorkerJobHistoryDto> History);
