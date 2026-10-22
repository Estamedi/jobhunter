using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileSkill;

[Authorize]
public record DeleteProfileSkillCommand(int Id) : IRequest;

public class DeleteProfileSkillCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteProfileSkillCommand>
{
    public async Task Handle(DeleteProfileSkillCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.ProfileSkills.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(ProfileSkill), request.Id);

        context.ProfileSkills.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
