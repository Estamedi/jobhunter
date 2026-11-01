namespace backend.jobhunter.Application.Common.Models;

public record RegisteredUserDto(
    string Id,
    string Email,
    string[] Roles,
    string OnboardingStatus,
    bool HasPassword,
    bool UsesGoogle,
    bool EmailConfirmed,
    DateTimeOffset? Created);

public record RegisteredUsersResult(
    IReadOnlyList<RegisteredUserDto> Items,
    int Total,
    int TotalUsers,
    int NewThisWeek);
