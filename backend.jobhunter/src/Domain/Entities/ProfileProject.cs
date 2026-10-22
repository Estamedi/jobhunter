namespace backend.jobhunter.Domain.Entities;

public class ProfileProject : OwnedEntity
{
    public int ProfileId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Url { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int SortOrder { get; set; }

    public CandidateProfile Profile { get; set; } = null!;
}
