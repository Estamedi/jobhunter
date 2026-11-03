using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Domain.Entities;

public class ProfileSkill : OwnedEntity
{
    public int ProfileId { get; set; }
    public string Name { get; set; } = string.Empty;

    // Free-form grouping such as "Backend", "Cloud" or "Tools"; skills with no category are shown ungrouped.
    public string? Category { get; set; }
    public int SortOrder { get; set; }

    // How the candidate knows this skill; null means not set.
    public SkillEvidenceLevel? EvidenceLevel { get; set; }

    // Optional "where did you use it?" text, for example "built a billing API in a side project".
    public string? Note { get; set; }

    public CandidateProfile Profile { get; set; } = null!;
}
