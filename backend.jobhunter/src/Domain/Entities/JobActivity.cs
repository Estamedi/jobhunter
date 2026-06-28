namespace backend.jobhunter.Domain.Entities;

public class JobActivity : BaseAuditableEntity
{
    public int CandidateId { get; set; }
    public int? ApplicationId { get; set; }
    public int? CompanyId { get; set; }
    public int? ContactId { get; set; }
    public string Type { get; set; } = "Note";
    public DateTimeOffset ActivityDate { get; set; } = DateTimeOffset.UtcNow;
    public string? Outcome { get; set; }
    public string? Notes { get; set; }

    public Candidate Candidate { get; set; } = null!;
    public JobApplication? Application { get; set; }
    public JobCompany? Company { get; set; }
    public JobContact? Contact { get; set; }
}
