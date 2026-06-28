namespace backend.jobhunter.Domain.Entities;

public class JobInterview : BaseAuditableEntity
{
    public int ApplicationId { get; set; }
    public int CandidateId { get; set; }
    public int CompanyId { get; set; }
    public string Round { get; set; } = "HR";
    public DateTimeOffset InterviewDate { get; set; }
    public int? DurationMinutes { get; set; }
    public string? InterviewerName { get; set; }
    public string? InterviewerEmail { get; set; }
    public string? MeetingLink { get; set; }
    public string Status { get; set; } = "Scheduled";
    public string? PreparationNotes { get; set; }
    public string? InterviewNotes { get; set; }
    public string? Feedback { get; set; }

    public JobApplication Application { get; set; } = null!;
    public Candidate Candidate { get; set; } = null!;
    public JobCompany Company { get; set; } = null!;
}
