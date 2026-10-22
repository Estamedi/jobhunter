namespace backend.jobhunter.Domain.Entities;

public class ProfileEducation : OwnedEntity
{
    public int ProfileId { get; set; }
    public string Institution { get; set; } = string.Empty;
    public string Degree { get; set; } = string.Empty;
    public string? FieldOfStudy { get; set; }
    public string? Location { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Details { get; set; }
    public int SortOrder { get; set; }

    public CandidateProfile Profile { get; set; } = null!;
}
