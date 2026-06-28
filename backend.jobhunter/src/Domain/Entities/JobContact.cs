namespace backend.jobhunter.Domain.Entities;

public class JobContact : BaseAuditableEntity
{
    public string FullName { get; set; } = string.Empty;
    public int CompanyId { get; set; }
    public string? JobTitle { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? LinkedInUrl { get; set; }
    public string Type { get; set; } = "Other";
    public string Warmth { get; set; } = "Cold";
    public string? Notes { get; set; }

    public JobCompany Company { get; set; } = null!;
    public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
    public ICollection<JobActivity> Activities { get; set; } = new List<JobActivity>();
}
