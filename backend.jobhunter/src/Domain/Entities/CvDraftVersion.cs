namespace backend.jobhunter.Domain.Entities;

// The content of a CV draft as it was just before an edit, a section refine or a restore replaced it,
// so any of those can be undone. Created is the moment it was replaced.
public class CvDraftVersion : OwnedEntity
{
    public int CvDraftId { get; set; }
    public string ContentJson { get; set; } = "{}";
    // What replaced it, e.g. "Before refining summary" or "Before editing by hand".
    public string Reason { get; set; } = string.Empty;

    public CvDraft CvDraft { get; set; } = null!;
}
