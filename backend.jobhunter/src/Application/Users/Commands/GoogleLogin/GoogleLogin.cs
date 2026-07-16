using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Application.Users.Commands.GoogleLogin;

public record GoogleLoginCommand(string IdToken) : IRequest;

public class GoogleLoginCommandHandler(IIdentityService identityService)
    : IRequestHandler<GoogleLoginCommand>
{
    public Task Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
        => identityService.GoogleLoginAsync(request.IdToken);
}
