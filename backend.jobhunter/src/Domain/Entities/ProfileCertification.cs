namespace backend.jobhunter.Domain.Entities;

public class ProfileCertification : OwnedEntity
{
    public int ProfileId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Issuer { get; set; }
    public DateOnly? IssuedDate { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public string? CredentialUrl { get; set; }
    public int SortOrder { get; set; }

    public CandidateProfile Profile { get; set; } = null!;
}
