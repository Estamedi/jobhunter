namespace backend.jobhunter.Domain.Entities;

public class ProfileSkill : OwnedEntity
{
    public int ProfileId { get; set; }
    public string Name { get; set; } = string.Empty;

    // Free-form grouping such as "Backend", "Cloud" or "Tools"; skills with no category are shown ungrouped.
    public string? Category { get; set; }
    public int SortOrder { get; set; }

    public CandidateProfile Profile { get; set; } = null!;
}
