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
    // Kept so regenerating a section writes in the same tone and language as the original draft.
    public string? Tone { get; set; }
    public string? Language { get; set; }
    public string ContentJson { get; set; } = "{}";
    public string TemplateId { get; set; } = "classic";

    public Candidate Candidate { get; set; } = null!;
    public Cv? SourceCv { get; set; }
    public JobApplication? JobApplication { get; set; }
}
