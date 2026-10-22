using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileCertification;

[Authorize]
public record DeleteProfileCertificationCommand(int Id) : IRequest;

public class DeleteProfileCertificationCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteProfileCertificationCommand>
{
    public async Task Handle(DeleteProfileCertificationCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.ProfileCertifications.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(ProfileCertification), request.Id);

        context.ProfileCertifications.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
