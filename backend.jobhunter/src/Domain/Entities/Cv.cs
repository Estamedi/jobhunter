namespace backend.jobhunter.Domain.Entities;

public class Cv : OwnedEntity
{
    public int CandidateId { get; set; }
    public int? ApplicationId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string StorageKey { get; set; } = string.Empty;

    public Candidate Candidate { get; set; } = null!;
    public JobApplication? Application { get; set; }
}
