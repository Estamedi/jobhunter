namespace backend.jobhunter.Domain.Entities;

public class JobApplication : BaseAuditableEntity
{
    public int CandidateId { get; set; }
    public int JobRoleId { get; set; }
    public int CompanyId { get; set; }
    public int? MainContactId { get; set; }
    public string Status { get; set; } = "Wishlist";
    public string Priority { get; set; } = "Medium";
    public DateTimeOffset? AppliedDate { get; set; }
    public DateTimeOffset? LastActivityDate { get; set; }
    public DateTimeOffset? NextFollowUpDate { get; set; }
    public string? ResumeVersion { get; set; }
    public string? CoverLetterVersion { get; set; }
    public decimal? ExpectedSalary { get; set; }
    public decimal? ActualOfferSalary { get; set; }
    public string? Currency { get; set; }
    public string? RejectionReason { get; set; }
    public string? Notes { get; set; }

    public Candidate Candidate { get; set; } = null!;
    public JobRole JobRole { get; set; } = null!;
    public JobCompany Company { get; set; } = null!;
    public JobContact? MainContact { get; set; }
    public ICollection<JobActivity> Activities { get; set; } = new List<JobActivity>();
    public ICollection<JobInterview> Interviews { get; set; } = new List<JobInterview>();
}
