using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Models;
using backend.jobhunter.Domain.Enums;
using backend.jobhunter.Infrastructure.Data;
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
    private readonly IApplicationDbContext _dbContext;

    public IdentityService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IUserClaimsPrincipalFactory<ApplicationUser> userClaimsPrincipalFactory,
        IAuthorizationService authorizationService,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        IApplicationDbContext dbContext)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _userClaimsPrincipalFactory = userClaimsPrincipalFactory;
        _authorizationService = authorizationService;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _dbContext = dbContext;
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

    public async Task<RegisteredUsersResult> GetUsersAsync(
        string? search, string? role, int page, int pageSize, CancellationToken cancellationToken)
    {
        var users = _userManager.Users.AsNoTracking();
        var db = (ApplicationDbContext)_dbContext;

        var totalUsers = await users.CountAsync(cancellationToken);
        var weekAgo = DateTimeOffset.UtcNow.AddDays(-7);
        var newThisWeek = await users.CountAsync(u => u.Created >= weekAgo, cancellationToken);

        var filtered = users;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            filtered = filtered.Where(u => (u.Email ?? u.UserName ?? string.Empty).ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            var roleName = role.Trim();
            filtered = filtered.Where(u => db.UserRoles.Any(ur =>
                ur.UserId == u.Id &&
                db.Roles.Any(r => r.Id == ur.RoleId && r.Name == roleName)));
        }

        var total = await filtered.CountAsync(cancellationToken);

        var pageUsers = await filtered
            .OrderByDescending(u => u.Created)
            .ThenBy(u => u.Email)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var ids = pageUsers.Select(u => u.Id).ToList();

        var roleRows = await (
            from ur in db.UserRoles
            join r in db.Roles on ur.RoleId equals r.Id
            where ids.Contains(ur.UserId)
            select new { ur.UserId, RoleName = r.Name })
            .ToListAsync(cancellationToken);
        var rolesByUser = roleRows.ToLookup(x => x.UserId, x => x.RoleName ?? string.Empty);

        var googleIds = await db.UserLogins
            .Where(l => l.LoginProvider == "Google" && ids.Contains(l.UserId))
            .Select(l => l.UserId)
            .ToListAsync(cancellationToken);
        var googleSet = googleIds.ToHashSet();

        var items = pageUsers.Select(u => new RegisteredUserDto(
            u.Id,
            u.Email ?? u.UserName ?? string.Empty,
            [.. rolesByUser[u.Id]],
            u.OnboardingStatus.ToString(),
            !string.IsNullOrEmpty(u.PasswordHash),
            googleSet.Contains(u.Id),
            u.EmailConfirmed,
            u.Created)).ToList();

        return new RegisteredUsersResult(items, total, totalUsers, newThisWeek);
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
            googleUser = new GoogleUserInfo(tokenInfo.Subject, tokenInfo.Email, true, tokenInfo.Name);
        }

        if (googleUser is null)
        {
            // The web app and extension send an OAuth access token, not an ID token. Any Google app can
            // mint one for the same person, so it is only trusted when it was issued to our client id.
            GoogleAccessTokenInfo? accessTokenInfo;

            try
            {
                accessTokenInfo = await httpClient.GetFromJsonAsync<GoogleAccessTokenInfo>(
                    $"https://oauth2.googleapis.com/tokeninfo?access_token={Uri.EscapeDataString(idToken)}");
            }
            catch (HttpRequestException)
            {
                accessTokenInfo = null;
            }

            if (accessTokenInfo is not null
                && (accessTokenInfo.Audience == googleClientId || accessTokenInfo.AuthorizedParty == googleClientId))
            {
                var userInfoRequest = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v3/userinfo");
                userInfoRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", idToken);

                var userInfoResponse = await httpClient.SendAsync(userInfoRequest);

                if (userInfoResponse.IsSuccessStatusCode)
                {
                    googleUser = await userInfoResponse.Content.ReadFromJsonAsync<GoogleUserInfo>();

                    if (googleUser is not null && googleUser.Subject != accessTokenInfo.Subject)
                    {
                        googleUser = null;
                    }
                }
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

            if (user is not null && !user.EmailConfirmed)
            {
                // Someone may have pre-registered this address with a password they chose. Google has
                // just proven the real owner, so drop that password and confirm the account before linking.
                if (await _userManager.HasPasswordAsync(user))
                {
                    var removeResult = await _userManager.RemovePasswordAsync(user);

                    if (!removeResult.Succeeded)
                    {
                        throw ToValidationException(removeResult);
                    }
                }

                var confirmationToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                var confirmResult = await _userManager.ConfirmEmailAsync(user, confirmationToken);

                if (!confirmResult.Succeeded)
                {
                    throw ToValidationException(confirmResult);
                }

                await _userManager.UpdateSecurityStampAsync(user);
            }

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

                await UseGoogleNameForCandidateAsync(user, googleUser.Name);
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

    private async Task UseGoogleNameForCandidateAsync(ApplicationUser user, string? name)
    {
        if (string.IsNullOrWhiteSpace(name) || !Guid.TryParse(user.Id, out var ownerId))
        {
            return;
        }

        var candidate = await _dbContext.Candidates
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.OwnerId == ownerId);

        if (candidate is null)
        {
            return;
        }

        candidate.FullName = name.Trim();
        await _dbContext.SaveChangesAsync(CancellationToken.None);
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
        [property: JsonPropertyName("email_verified")] string EmailVerified,
        [property: JsonPropertyName("name")] string? Name = null);

    private sealed record GoogleAccessTokenInfo(
        [property: JsonPropertyName("aud")] string? Audience,
        [property: JsonPropertyName("azp")] string? AuthorizedParty,
        [property: JsonPropertyName("sub")] string? Subject);

    private sealed record GoogleUserInfo(
        [property: JsonPropertyName("sub")] string Subject,
        [property: JsonPropertyName("email")] string Email,
        [property: JsonPropertyName("email_verified")] bool EmailVerified,
        [property: JsonPropertyName("name")] string? Name = null);
}
