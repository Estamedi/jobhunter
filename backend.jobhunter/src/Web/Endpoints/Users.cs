using backend.jobhunter.Infrastructure.Identity;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace backend.jobhunter.Web.Endpoints;

public class Users : IEndpointGroup
{
    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapIdentityApi<ApplicationUser>();

        groupBuilder.MapPost(GoogleLogin, "google-login");
        groupBuilder.MapPost(Logout, "logout").RequireAuthorization();
    }

    [EndpointSummary("Log in with Google")]
    [EndpointDescription("Exchanges a Google ID token for the application's bearer token.")]
    public static async Task<Results<EmptyHttpResult, ValidationProblem, ProblemHttpResult>> GoogleLogin(
        [FromBody] GoogleLoginRequest request,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(request.IdToken)] = ["Google ID token is required."],
            });
        }

        var googleClientId = configuration["Authentication:Google:ClientId"];

        if (string.IsNullOrWhiteSpace(googleClientId))
        {
            return TypedResults.Problem("Google client id is not configured.", statusCode: StatusCodes.Status500InternalServerError);
        }

        var httpClient = httpClientFactory.CreateClient();
        GoogleUserInfo? googleUser = null;
        GoogleTokenInfo? tokenInfo;

        try
        {
            tokenInfo = await httpClient.GetFromJsonAsync<GoogleTokenInfo>(
                $"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(request.IdToken)}");
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
            userInfoRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", request.IdToken);

            var userInfoResponse = await httpClient.SendAsync(userInfoRequest);

            if (userInfoResponse.IsSuccessStatusCode)
            {
                googleUser = await userInfoResponse.Content.ReadFromJsonAsync<GoogleUserInfo>();
            }
        }

        if (googleUser is null || string.IsNullOrWhiteSpace(googleUser.Subject) || string.IsNullOrWhiteSpace(googleUser.Email) || !googleUser.EmailVerified)
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(request.IdToken)] = ["Google token is invalid."],
            });
        }

        var user = await userManager.FindByLoginAsync("Google", googleUser.Subject);

        if (user is null)
        {
            user = await userManager.FindByEmailAsync(googleUser.Email);

            if (user is null)
            {
                user = new ApplicationUser
                {
                    UserName = googleUser.Email,
                    Email = googleUser.Email,
                    EmailConfirmed = true,
                };

                var createResult = await userManager.CreateAsync(user);

                if (!createResult.Succeeded)
                {
                    return TypedResults.ValidationProblem(ToValidationErrors(createResult));
                }
            }

            var loginResult = await userManager.AddLoginAsync(user, new UserLoginInfo("Google", googleUser.Subject, "Google"));

            if (!loginResult.Succeeded)
            {
                return TypedResults.ValidationProblem(ToValidationErrors(loginResult));
            }
        }

        signInManager.AuthenticationScheme = IdentityConstants.BearerScheme;
        await signInManager.SignInAsync(user, isPersistent: false);

        return TypedResults.Empty;
    }

    [EndpointSummary("Log out")]
    [EndpointDescription("Logs out the current user by clearing the authentication cookie.")]
    public static async Task<Results<Ok, UnauthorizedHttpResult>> Logout(SignInManager<ApplicationUser> signInManager, [FromBody] object empty)
    {
        if (empty != null)
        {
            await signInManager.SignOutAsync();
            return TypedResults.Ok();
        }

        return TypedResults.Unauthorized();
    }

    public sealed record GoogleLoginRequest(string IdToken);

    private sealed record GoogleTokenInfo(
        [property: JsonPropertyName("sub")] string Subject,
        [property: JsonPropertyName("aud")] string Audience,
        [property: JsonPropertyName("email")] string Email,
        [property: JsonPropertyName("email_verified")] string EmailVerified);

    private sealed record GoogleUserInfo(
        [property: JsonPropertyName("sub")] string Subject,
        [property: JsonPropertyName("email")] string Email,
        [property: JsonPropertyName("email_verified")] bool EmailVerified);

    private static Dictionary<string, string[]> ToValidationErrors(IdentityResult result)
    {
        return result.Errors
            .GroupBy(error => error.Code)
            .ToDictionary(group => group.Key, group => group.Select(error => error.Description).ToArray());
    }
}
