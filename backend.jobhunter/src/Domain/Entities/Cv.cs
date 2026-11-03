using backend.jobhunter.Domain.Enums;
using backend.jobhunter.Domain.Events;

namespace backend.jobhunter.Domain.Entities;

public class Cv : OwnedEntity
{
    public int CandidateId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string StorageKey { get; set; } = string.Empty;

    // Remote (S3) sync state. The local copy is a cache; the upload runs in a background worker.
    public CvUploadStatus UploadStatus { get; set; } = CvUploadStatus.Uploaded;
    public int UploadAttempts { get; set; }
    public DateTimeOffset? LastUploadAttemptAt { get; set; }
    public string? LastUploadError { get; set; }

    public Candidate Candidate { get; set; } = null!;
    public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();

    // Call right after creating the Cv. When the storage needs a remote copy the Cv is queued
    // (Pending) and a domain event wakes the upload worker; otherwise nothing is queued.
    public void MarkForUpload(bool requiresRemoteSync)
    {
        if (!requiresRemoteSync)
        {
            UploadStatus = CvUploadStatus.Uploaded;
            return;
        }

        UploadStatus = CvUploadStatus.Pending;
        UploadAttempts = 0;
        AddDomainEvent(new CvUploadRequestedEvent(this));
    }
}
