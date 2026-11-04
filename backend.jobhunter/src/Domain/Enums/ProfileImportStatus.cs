namespace backend.jobhunter.Domain.Enums;

// Where a CV import is. The AI reads the CV in the background, so a job exists before it has a result.
public enum ProfileImportStatus
{
    // Saved and waiting for the background worker.
    Pending = 0,
    // The worker is reading the CV now.
    Running = 1,
    // The result is stored and waiting for the user to review it.
    Completed = 2,
    // Reading failed; Error says why. Starting the import again puts it back in the queue.
    Failed = 3,
}
