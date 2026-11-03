using System.Security.Claims;

using backend.jobhunter.Application.Common;
using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Web.Services;

public class CurrentUser : IUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly UserOverride _override;

    public CurrentUser(IHttpContextAccessor httpContextAccessor, UserOverride userOverride)
    {
        _httpContextAccessor = httpContextAccessor;
        _override = userOverride;
    }

    // Background work (the CV worker) has no HTTP request and runs as the user it was set to.
    public string? Id => _override.Id ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
    public List<string>? Roles => _httpContextAccessor.HttpContext?.User?.FindAll(ClaimTypes.Role).Select(x => x.Value).ToList();

}
