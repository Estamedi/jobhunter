namespace backend.jobhunter.Application.Common.Interfaces;

public record JobExtractionStatusDto
{
    // Processing | Completed | Failed
    public string Status { get; init; } = "Processing";
    public ExtractedJobDto? Job { get; init; }
    public string? Error { get; init; }
}

// Runs AI job extraction as a background job. A repeated request for the same user and URL joins the extraction
// already queued or running instead of paying for another AI call.
public interface IJobExtractionQueue
{
    // Queues the page (or joins the one already queued/running) and waits for the result.
    Task<ExtractedJobDto> ExtractAsync(string userId, JobPageContent page, CancellationToken cancellationToken);

    // Current state for the user's URL, or null when nothing is queued or remembered.
    JobExtractionStatusDto? Get(string userId, string url);
}
