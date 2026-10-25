namespace backend.jobhunter.Domain.Entities;

// The answers from the onboarding questions (one row per candidate). List values are stored
// comma-separated, like Candidate.TargetCountries.
public class CandidatePreferences : OwnedEntity
{
    public int CandidateId { get; set; }
    public string? WorkStatus { get; set; }
    public string? SearchIntensity { get; set; }
    public string? PrimaryGoal { get; set; }
    public int? MinSalary { get; set; }
    public string? SalaryCurrency { get; set; }
    public string? EmploymentTypes { get; set; }
    public string? WorkModes { get; set; }
    public bool? WillingToRelocate { get; set; }
    public string? RemoteRegions { get; set; }
    public string? CommuteCities { get; set; }
    public string? WorkAuthorization { get; set; }
    public string? Industries { get; set; }

    public Candidate Candidate { get; set; } = null!;
}
