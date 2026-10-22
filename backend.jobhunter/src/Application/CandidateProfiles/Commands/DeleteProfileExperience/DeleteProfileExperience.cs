using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileExperience;

[Authorize]
public record DeleteProfileExperienceCommand(int Id) : IRequest;

public class DeleteProfileExperienceCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteProfileExperienceCommand>
{
    public async Task Handle(DeleteProfileExperienceCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.ProfileExperiences.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(ProfileExperience), request.Id);

        context.ProfileExperiences.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
