namespace backend.jobhunter.Domain.Entities;

// The structured, LinkedIn-style profile of a candidate (one per candidate). Name, email, phone
// and location stay on Candidate; everything a CV is built from lives here and in the children.
// Dates in the profile sections are month-precision: store the first day of the month (or of
// the year when only a year is known).
public class CandidateProfile : OwnedEntity
{
    public int CandidateId { get; set; }
    public string? Headline { get; set; }
    public string? Summary { get; set; }

    // Set when the profile was filled by importing an uploaded CV.
    public int? ImportedFromCvId { get; set; }
    public DateTimeOffset? LastImportedAt { get; set; }

    public Candidate Candidate { get; set; } = null!;
    public Cv? ImportedFromCv { get; set; }
    public ICollection<ProfileLink> Links { get; set; } = new List<ProfileLink>();
    public ICollection<ProfileExperience> Experiences { get; set; } = new List<ProfileExperience>();
    public ICollection<ProfileEducation> Educations { get; set; } = new List<ProfileEducation>();
    public ICollection<ProfileSkill> Skills { get; set; } = new List<ProfileSkill>();
    public ICollection<ProfileProject> Projects { get; set; } = new List<ProfileProject>();
    public ICollection<ProfileCertification> Certifications { get; set; } = new List<ProfileCertification>();
    public ICollection<ProfileLanguage> Languages { get; set; } = new List<ProfileLanguage>();
}
