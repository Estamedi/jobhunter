namespace backend.jobhunter.Domain.Entities;

public class Candidate : OwnedEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? CurrentLocation { get; set; }
    public string? TargetCountries { get; set; }
    public string PreferredWorkType { get; set; } = "Any";
    public string? TargetRoles { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
    public ICollection<JobActivity> Activities { get; set; } = new List<JobActivity>();
    public ICollection<JobInterview> Interviews { get; set; } = new List<JobInterview>();
}
