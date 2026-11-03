using System.Security.Claims;
using backend.jobhunter.Application.Common;
using backend.jobhunter.Web.Services;
using Microsoft.AspNetCore.Http;

namespace backend.jobhunter.Application.FunctionalTests.CvGeneration;

// The real CurrentUser (the functional host swaps it for a mock), so the worker's user switch is covered.
public class BackgroundUserTests
{
    private static IHttpContextAccessor RequestFrom(string? userId)
    {
        var context = new DefaultHttpContext();
        if (userId is not null)
        {
            context.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, userId)], "test"));
        }
        return new HttpContextAccessor { HttpContext = context };
    }

    [Test]
    public void ShouldRunAsTheOverrideWhenThereIsNoRequest()
    {
        var user = new CurrentUser(new HttpContextAccessor(), new UserOverride { Id = "owner-1" });

        user.Id.ShouldBe("owner-1");
    }

    [Test]
    public void ShouldPreferTheOverrideOverTheRequestsUser()
    {
        var user = new CurrentUser(RequestFrom("request-user"), new UserOverride { Id = "owner-1" });

        user.Id.ShouldBe("owner-1");
    }

    [Test]
    public void ShouldUseTheRequestsUserWhenNothingIsOverridden()
    {
        var user = new CurrentUser(RequestFrom("request-user"), new UserOverride());

        user.Id.ShouldBe("request-user");
    }

    [Test]
    public void ShouldHaveNoUserWithNeitherARequestNorAnOverride()
        => new CurrentUser(new HttpContextAccessor(), new UserOverride()).Id.ShouldBeNull();
}
