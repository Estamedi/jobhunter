namespace backend.jobhunter.Application.Common;

// Lets background work run as a given user. There is no HTTP request there, so the current user is
// empty and the per-user data filters would hide everything. The worker sets Id to the draft's owner
// before it opens the database, and CurrentUser reads it first.
public sealed class UserOverride
{
    public string? Id { get; set; }
}
