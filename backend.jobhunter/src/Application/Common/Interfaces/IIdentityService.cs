using backend.jobhunter.Application.Common.Models;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.Common.Interfaces;

public interface IIdentityService
{
    Task<string?> GetUserNameAsync(string userId);

    Task<bool> IsInRoleAsync(string userId, string role);

    Task<bool> AuthorizeAsync(string userId, string policyName);

    Task<(Result Result, string UserId)> CreateUserAsync(string userName, string password);

    Task<Result> DeleteUserAsync(string userId);

    Task<CurrentUserInfo> GetCurrentUserInfoAsync(string userId);

    Task UpdateOnboardingStatusAsync(string userId, OnboardingStatus status);

    Task SetPasswordAsync(string userId, string newPassword, string? oldPassword);

    Task GoogleLoginAsync(string idToken);

    Task LogoutAsync();
}
