using backend.jobhunter.Domain.Constants;
using Hangfire;
using Hangfire.Dashboard;
using Microsoft.AspNetCore.DataProtection;

namespace backend.jobhunter.Web.Services;

// Hangfire's own dashboard at /hangfire, for administrators only. The API uses bearer tokens, which a browser
// does not send when it opens a page, so an administrator asks the API (with the token) for a link that is
// valid for one minute. Opening it sets an HttpOnly cookie that lasts a working day and only the dashboard reads.
public static class HangfireDashboardAccess
{
    public const string Path = "/hangfire";
    private const string LoginPath = "/hangfire-login";
    private const string CookieName = "hangfire_admin";
    private const string Purpose = "HangfireDashboard.v1";
    private static readonly TimeSpan TicketLife = TimeSpan.FromMinutes(1);
    private static readonly TimeSpan CookieLife = TimeSpan.FromHours(8);

    private static ITimeLimitedDataProtector Protector(IDataProtectionProvider provider)
        => provider.CreateProtector(Purpose).ToTimeLimitedDataProtector();

    public static string CreateLink(IDataProtectionProvider provider)
        => $"{LoginPath}?ticket={Uri.EscapeDataString(Protector(provider).Protect("ticket", TicketLife))}";

    public static void MapHangfireDashboard(this WebApplication app)
    {
        app.MapGet(LoginPath, (HttpContext context, IDataProtectionProvider provider, string? ticket) =>
        {
            if (!IsValid(provider, ticket, "ticket")) return Results.Unauthorized();

            context.Response.Cookies.Append(CookieName, Protector(provider).Protect("session", CookieLife), new CookieOptions
            {
                HttpOnly = true,
                Secure = context.Request.IsHttps,
                SameSite = SameSiteMode.Strict,
                Path = Path,
                MaxAge = CookieLife,
            });
            return Results.Redirect(Path);
        }).AllowAnonymous();

        app.UseHangfireDashboard(Path, new DashboardOptions
        {
            Authorization = [new AdministratorCookieFilter()],
            DashboardTitle = "Job Hunter CRM - Background jobs",
            IsReadOnlyFunc = _ => false,
        });
    }

    private static bool IsValid(IDataProtectionProvider provider, string? value, string expected)
    {
        if (string.IsNullOrEmpty(value)) return false;
        try { return Protector(provider).Unprotect(value) == expected; }
        catch (Exception) { return false; }
    }

    private sealed class AdministratorCookieFilter : IDashboardAuthorizationFilter
    {
        public bool Authorize(DashboardContext context)
        {
            var http = context.GetHttpContext();
            var provider = http.RequestServices.GetRequiredService<IDataProtectionProvider>();
            return IsValid(provider, http.Request.Cookies[CookieName], "session");
        }
    }
}
