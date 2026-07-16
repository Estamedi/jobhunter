namespace backend.jobhunter.Application.Common.Models;

public record CurrentUserInfo(string Id, string Email, string[] Roles, string OnboardingStatus, bool HasPassword);
