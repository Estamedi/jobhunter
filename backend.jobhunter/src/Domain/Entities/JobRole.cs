namespace backend.jobhunter.Domain.Entities;

public class JobRole : OwnedEntity
{
    public int CompanyId { get; set; }
    public int? JobTitleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? JobLink { get; set; }
    public string Source { get; set; } = "Other";
    public string? Country { get; set; }
    public string? City { get; set; }
    public string WorkType { get; set; } = "Remote";
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public string? Currency { get; set; }
    public string EmploymentType { get; set; } = "FullTime";
    public string RoleStatus { get; set; } = "Open";
    public string? Description { get; set; }
    public string? Requirements { get; set; }

    public JobCompany Company { get; set; } = null!;
    public JobTitle? JobTitle { get; set; }
    public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
}
