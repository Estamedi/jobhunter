using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.Users.Commands.UpdateOnboardingStatus;

[Authorize]
public record UpdateOnboardingStatusCommand(string UserId, string Status) : IRequest;

public class UpdateOnboardingStatusCommandHandler(IIdentityService identityService)
    : IRequestHandler<UpdateOnboardingStatusCommand>
{
    public async Task Handle(UpdateOnboardingStatusCommand request, CancellationToken cancellationToken)
    {
        var status = Enum.Parse<OnboardingStatus>(request.Status);

        await identityService.UpdateOnboardingStatusAsync(request.UserId, status);
    }
}
