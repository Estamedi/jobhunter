using System.Security.Claims;
using backend.jobhunter.Application.Common.Models;
using backend.jobhunter.Application.Users.Commands.GoogleLogin;
using backend.jobhunter.Application.Users.Commands.Logout;
using backend.jobhunter.Application.Users.Commands.SetPassword;
using backend.jobhunter.Application.Users.Commands.UpdateOnboardingStatus;
using backend.jobhunter.Application.Users.Queries.GetCurrentUser;
using backend.jobhunter.Infrastructure.Identity;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace backend.jobhunter.Web.Endpoints;

public class Users : IEndpointGroup
{
    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapIdentityApi<ApplicationUser>();

        groupBuilder.MapPost(GoogleLogin, "google-login");
        groupBuilder.MapPost(Logout, "logout").RequireAuthorization();
        groupBuilder.MapGet(GetCurrentUser, "me").RequireAuthorization();
        groupBuilder.MapPut(UpdateOnboardingStatus, "onboarding-status").RequireAuthorization();
        groupBuilder.MapPost(SetPassword, "password").RequireAuthorization();
    }

    [EndpointSummary("Get the current user")]
    [EndpointDescription("Returns the authenticated user's id, email, roles, onboarding status, and whether a password is set.")]
    public static async Task<Results<Ok<CurrentUserInfo>, UnauthorizedHttpResult>> GetCurrentUser(
        ClaimsPrincipal claimsPrincipal,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var userId = claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        return TypedResults.Ok(await sender.Send(new GetCurrentUserQuery(userId), cancellationToken));
    }

    [EndpointSummary("Update onboarding status")]
    [EndpointDescription("Marks the current user's onboarding as completed or skipped.")]
    public static async Task<Results<Ok, UnauthorizedHttpResult>> UpdateOnboardingStatus(
        [FromBody] UpdateOnboardingStatusRequest request,
        ClaimsPrincipal claimsPrincipal,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var userId = claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        await sender.Send(new UpdateOnboardingStatusCommand(userId, request.Status), cancellationToken);

        return TypedResults.Ok();
    }

    public sealed record UpdateOnboardingStatusRequest(string Status);

    [EndpointSummary("Log in with Google")]
    [EndpointDescription("Exchanges a Google ID token for the application's bearer token.")]
    public static async Task<EmptyHttpResult> GoogleLogin(
        [FromBody] GoogleLoginRequest request,
        ISender sender,
        CancellationToken cancellationToken)
    {
        await sender.Send(new GoogleLoginCommand(request.IdToken), cancellationToken);

        return TypedResults.Empty;
    }

    public sealed record GoogleLoginRequest(string IdToken);

    [EndpointSummary("Log out")]
    [EndpointDescription("Logs out the current user by clearing the authentication cookie.")]
    public static async Task<Ok> Logout(ISender sender, CancellationToken cancellationToken)
    {
        await sender.Send(new LogoutCommand(), cancellationToken);

        return TypedResults.Ok();
    }

    [EndpointSummary("Set or change the current user's password")]
    [EndpointDescription("Sets a password for accounts created without one (e.g. Google sign-in), or changes the existing password given the current one.")]
    public static async Task<Results<Ok, UnauthorizedHttpResult>> SetPassword(
        [FromBody] SetPasswordRequest request,
        ClaimsPrincipal claimsPrincipal,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var userId = claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        await sender.Send(new SetPasswordCommand(userId, request.NewPassword, request.OldPassword), cancellationToken);

        return TypedResults.Ok();
    }

    public sealed record SetPasswordRequest(string? OldPassword, string NewPassword);
}
