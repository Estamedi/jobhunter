using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Users.Commands.Logout;

[Authorize]
public record LogoutCommand : IRequest;

public class LogoutCommandHandler(IIdentityService identityService)
    : IRequestHandler<LogoutCommand>
{
    public Task Handle(LogoutCommand request, CancellationToken cancellationToken)
        => identityService.LogoutAsync();
}
