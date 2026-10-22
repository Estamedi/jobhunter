using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Domain.Entities;

// Mirrors LinkedIn's "Edit experience" form. Required: Title, Company, StartDate.
// EndDate must be null while IsCurrent is true. Description is free text (max 2000 characters)
// where achievements are written as "• " bullet lines, exactly as on LinkedIn.
// Skills are the role's own tag list (shown as "Skills: a, b, +2 skills" in view mode); media is
// left out of the MVP.
public class ProfileExperience : OwnedEntity
{
    public int ProfileId { get; set; }
    public string Title { get; set; } = string.Empty;
    public EmploymentType? EmploymentType { get; set; }
    public string Company { get; set; } = string.Empty;
    public bool IsCurrent { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Location { get; set; }
    public WorkplaceType? WorkplaceType { get; set; }
    public string? Description { get; set; }
    public List<string> Skills { get; set; } = new();

    public CandidateProfile Profile { get; set; } = null!;
}
