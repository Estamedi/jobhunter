using backend.jobhunter.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace backend.jobhunter.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public OnboardingStatus OnboardingStatus { get; set; } = OnboardingStatus.Pending;
}
