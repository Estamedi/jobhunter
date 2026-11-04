using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Domain.Entities;

// One AI reading of an uploaded CV, kept so it survives a closed window: the user can come back to the
// result. There is one job per CV; a failed one is queued again instead of a second one being made.
public class ProfileImportJob : OwnedEntity
{
    public int CvId { get; set; }
    public ProfileImportStatus Status { get; set; } = ProfileImportStatus.Pending;
    // The parsed profile as JSON (the same shape the review screens use), set when Status is Completed.
    public string? ResultJson { get; set; }
    // Why reading failed, in words the user can read.
    public string? Error { get; set; }
    // How many times the worker started on this job; a restart mid-read retries once.
    public int Attempts { get; set; }
    // When the user saved the reviewed result, so a finished job is not offered again.
    public DateTimeOffset? AppliedAt { get; set; }

    public Cv Cv { get; set; } = null!;
}
