namespace backend.jobhunter.Domain.Entities;

public class ProfileLink : OwnedEntity
{
    public int ProfileId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public CandidateProfile Profile { get; set; } = null!;
}
