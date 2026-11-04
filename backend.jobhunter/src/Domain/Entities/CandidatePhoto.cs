namespace backend.jobhunter.Domain.Entities;

// The photo a candidate puts on a CV, one per candidate. It is kept in the database, not in file storage:
// it is small (the browser scales it down before upload) and file storage only syncs CV files to S3, so a
// photo kept there would be lost when the server container is replaced.
public class CandidatePhoto : OwnedEntity
{
    public int CandidateId { get; set; }
    public byte[] Data { get; set; } = [];
    // "image/jpeg" or "image/png", set from the file's own signature, never from what the browser said.
    public string ContentType { get; set; } = string.Empty;

    public Candidate Candidate { get; set; } = null!;
}
