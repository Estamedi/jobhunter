using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Models;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Users.Queries.GetCurrentUser;

[Authorize]
public record GetCurrentUserQuery(string UserId) : IRequest<CurrentUserInfo>;

public class GetCurrentUserQueryHandler(IIdentityService identityService)
    : IRequestHandler<GetCurrentUserQuery, CurrentUserInfo>
{
    public Task<CurrentUserInfo> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
        => identityService.GetCurrentUserInfoAsync(request.UserId);
}
