using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Users.Commands.SetPassword;

[Authorize]
public record SetPasswordCommand(string UserId, string NewPassword, string? OldPassword) : IRequest;

public class SetPasswordCommandHandler(IIdentityService identityService)
    : IRequestHandler<SetPasswordCommand>
{
    public Task Handle(SetPasswordCommand request, CancellationToken cancellationToken)
        => identityService.SetPasswordAsync(request.UserId, request.NewPassword, request.OldPassword);
}
