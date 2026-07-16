using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Models;
using backend.jobhunter.Domain.Enums;
using FluentValidation.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ValidationException = backend.jobhunter.Application.Common.Exceptions.ValidationException;

namespace backend.jobhunter.Infrastructure.Identity;

public class IdentityService : IIdentityService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IUserClaimsPrincipalFactory<ApplicationUser> _userClaimsPrincipalFactory;
    private readonly IAuthorizationService _authorizationService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public IdentityService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IUserClaimsPrincipalFactory<ApplicationUser> userClaimsPrincipalFactory,
        IAuthorizationService authorizationService,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _userClaimsPrincipalFactory = userClaimsPrincipalFactory;
        _authorizationService = authorizationService;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public async Task<string?> GetUserNameAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);

        return user?.UserName;
    }

    public async Task<(Result Result, string UserId)> CreateUserAsync(string userName, string password)
    {
        var user = new ApplicationUser
        {
            UserName = userName,
            Email = userName,
        };

        var result = await _userManager.CreateAsync(user, password);

        return (result.ToApplicationResult(), user.Id);
    }

    public async Task<bool> IsInRoleAsync(string userId, string role)
    {
        var user = await _userManager.FindByIdAsync(userId);

        return user != null && await _userManager.IsInRoleAsync(user, role);
    }

    public async Task<bool> AuthorizeAsync(string userId, string policyName)
    {
        var user = await _userManager.FindByIdAsync(userId);

        if (user == null)
        {
            return false;
        }

        var principal = await _userClaimsPrincipalFactory.CreateAsync(user);

        var result = await _authorizationService.AuthorizeAsync(principal, policyName);

        return result.Succeeded;
    }

    public async Task<Result> DeleteUserAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);

        return user != null ? await DeleteUserAsync(user) : Result.Success();
    }

    public async Task<Result> DeleteUserAsync(ApplicationUser user)
    {
        var result = await _userManager.DeleteAsync(user);

        return result.ToApplicationResult();
    }

    public async Task<CurrentUserInfo> GetCurrentUserInfoAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new UnauthorizedAccessException();

        var roles = await _userManager.GetRolesAsync(user);
        var hasPassword = await _userManager.HasPasswordAsync(user);

        return new CurrentUserInfo(
            user.Id,
            user.Email ?? user.UserName ?? string.Empty,
            [.. roles],
            user.OnboardingStatus.ToString(),
            hasPassword);
    }

    public async Task UpdateOnboardingStatusAsync(string userId, OnboardingStatus status)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new UnauthorizedAccessException();

        user.OnboardingStatus = status;
        await _userManager.UpdateAsync(user);
    }

    public async Task SetPasswordAsync(string userId, string newPassword, string? oldPassword)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new UnauthorizedAccessException();

        var hasPassword = await _userManager.HasPasswordAsync(user);

        if (hasPassword)
        {
            if (string.IsNullOrWhiteSpace(oldPassword))
            {
                throw new ValidationException(
                [
                    new ValidationFailure(nameof(oldPassword), "Current password is required."),
                ]);
            }

            var changeResult = await _userManager.ChangePasswordAsync(user, oldPassword, newPassword);

            if (!changeResult.Succeeded)
            {
                throw ToValidationException(changeResult);
            }

            return;
        }

        var addResult = await _userManager.AddPasswordAsync(user, newPassword);

        if (!addResult.Succeeded)
        {
            throw ToValidationException(addResult);
        }
    }

    public async Task GoogleLoginAsync(string idToken)
    {
        var googleClientId = _configuration["Authentication:Google:ClientId"];

        if (string.IsNullOrWhiteSpace(googleClientId))
        {
            throw new InvalidOperationException("Google client id is not configured.");
        }

        var httpClient = _httpClientFactory.CreateClient();
        GoogleUserInfo? googleUser = null;
        GoogleTokenInfo? tokenInfo;

        try
        {
            tokenInfo = await httpClient.GetFromJsonAsync<GoogleTokenInfo>(
                $"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(idToken)}");
        }
        catch (HttpRequestException)
        {
            tokenInfo = null;
        }

        if (tokenInfo is not null && tokenInfo.Audience == googleClientId && tokenInfo.EmailVerified == "true")
        {
            googleUser = new GoogleUserInfo(tokenInfo.Subject, tokenInfo.Email, true);
        }

        if (googleUser is null)
        {
            var userInfoRequest = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v3/userinfo");
            userInfoRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", idToken);

            var userInfoResponse = await httpClient.SendAsync(userInfoRequest);

            if (userInfoResponse.IsSuccessStatusCode)
            {
                googleUser = await userInfoResponse.Content.ReadFromJsonAsync<GoogleUserInfo>();
            }
        }

        if (googleUser is null || string.IsNullOrWhiteSpace(googleUser.Subject) || string.IsNullOrWhiteSpace(googleUser.Email) || !googleUser.EmailVerified)
        {
            throw new ValidationException(
            [
                new ValidationFailure(nameof(idToken), "Google token is invalid."),
            ]);
        }

        var user = await _userManager.FindByLoginAsync("Google", googleUser.Subject);

        if (user is null)
        {
            user = await _userManager.FindByEmailAsync(googleUser.Email);

            if (user is null)
            {
                user = new ApplicationUser
                {
                    UserName = googleUser.Email,
                    Email = googleUser.Email,
                    EmailConfirmed = true,
                };

                var createResult = await _userManager.CreateAsync(user);

                if (!createResult.Succeeded)
                {
                    throw ToValidationException(createResult);
                }
            }

            var loginResult = await _userManager.AddLoginAsync(user, new UserLoginInfo("Google", googleUser.Subject, "Google"));

            if (!loginResult.Succeeded)
            {
                throw ToValidationException(loginResult);
            }
        }

        _signInManager.AuthenticationScheme = IdentityConstants.BearerScheme;
        await _signInManager.SignInAsync(user, isPersistent: false);
    }

    public Task LogoutAsync() => _signInManager.SignOutAsync();

    private static ValidationException ToValidationException(IdentityResult result)
    {
        return new ValidationException(result.Errors.Select(error => new ValidationFailure(error.Code, error.Description)));
    }

    private sealed record GoogleTokenInfo(
        [property: JsonPropertyName("sub")] string Subject,
        [property: JsonPropertyName("aud")] string Audience,
        [property: JsonPropertyName("email")] string Email,
        [property: JsonPropertyName("email_verified")] string EmailVerified);

    private sealed record GoogleUserInfo(
        [property: JsonPropertyName("sub")] string Subject,
        [property: JsonPropertyName("email")] string Email,
        [property: JsonPropertyName("email_verified")] bool EmailVerified);
}
