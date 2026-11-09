namespace backend.jobhunter.Domain.Entities;

/// <summary>
/// A request for a consultation sent from the public website. Not an owned entity: the sender has no account,
/// and only administrators read these, across the whole platform.
/// </summary>
public class ConsultationLead : BaseEntity
{
    public DateTimeOffset Created { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Message { get; set; }

    /// <summary>The website language the form was sent from (en, fa, ar).</summary>
    public string? Locale { get; set; }
}
