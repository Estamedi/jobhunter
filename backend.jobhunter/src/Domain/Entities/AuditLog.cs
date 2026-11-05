namespace backend.jobhunter.Domain.Entities;

/// <summary>
/// One action somebody took in the app (a command), whether it worked or not. Not an owned entity: only
/// administrators read these, across all users. Written by AuditBehaviour; never edited.
/// </summary>
public class AuditLog : BaseEntity
{
    public DateTimeOffset Timestamp { get; set; }
    public string? UserId { get; set; }
    public string? UserEmail { get; set; }

    /// <summary>The command's name without the "Command" suffix, for example "ImportProfile".</summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>The command's data as JSON with secrets removed and long text shortened.</summary>
    public string? Payload { get; set; }

    public bool Succeeded { get; set; }

    /// <summary>Why it failed: the validation errors as JSON, or the exception message.</summary>
    public string? Error { get; set; }
    public int DurationMs { get; set; }
}
