namespace backend.jobhunter.Domain.Enums;

// Where a draft is in its life. A draft is written in the background, so it exists before it has content.
// Completed is 0 so drafts made before this existed read as finished.
public enum CvDraftStatus
{
    Completed = 0,
    // Saved and waiting for the background worker.
    Pending = 1,
    // The worker is writing it now.
    Running = 2,
    // Writing failed; GenerationError says why. The user can try again.
    Failed = 3,
}
