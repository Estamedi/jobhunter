namespace backend.jobhunter.Domain.Entities;

public class JobCompany : OwnedEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Website { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public string? Industry { get; set; }
    public string? CompanySize { get; set; }
    public string Priority { get; set; } = "Medium";
    public string? Notes { get; set; }

    public ICollection<JobRole> JobRoles { get; set; } = new List<JobRole>();
    public ICollection<JobContact> Contacts { get; set; } = new List<JobContact>();
    public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
    public ICollection<JobActivity> Activities { get; set; } = new List<JobActivity>();
}
