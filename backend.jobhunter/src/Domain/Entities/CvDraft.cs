namespace backend.jobhunter.Domain.Entities;

public class CvDraft : OwnedEntity
{
    public int CandidateId { get; set; }
    public int? SourceCvId { get; set; }
    public int? JobApplicationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string? JobDescription { get; set; }
    public string? Instructions { get; set; }
    public string ContentJson { get; set; } = "{}";
    public string TemplateId { get; set; } = "classic";

    public Candidate Candidate { get; set; } = null!;
    public Cv? SourceCv { get; set; }
    public JobApplication? JobApplication { get; set; }
}
