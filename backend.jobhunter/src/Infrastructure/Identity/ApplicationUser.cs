using backend.jobhunter.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace backend.jobhunter.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public OnboardingStatus OnboardingStatus { get; set; } = OnboardingStatus.Pending;

    /// <summary>When the account registered. Null for accounts created before this was tracked.</summary>
    public DateTimeOffset? Created { get; set; } = DateTimeOffset.UtcNow;
}
