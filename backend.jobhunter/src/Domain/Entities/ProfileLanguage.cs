using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Domain.Entities;

public class ProfileLanguage : OwnedEntity
{
    public int ProfileId { get; set; }
    public string Name { get; set; } = string.Empty;
    public LanguageProficiency Proficiency { get; set; } = LanguageProficiency.ProfessionalWorking;
    public int SortOrder { get; set; }

    public CandidateProfile Profile { get; set; } = null!;
}
