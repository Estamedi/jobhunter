using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileProject;

[Authorize]
public record DeleteProfileProjectCommand(int Id) : IRequest;

public class DeleteProfileProjectCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteProfileProjectCommand>
{
    public async Task Handle(DeleteProfileProjectCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.ProfileProjects.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(ProfileProject), request.Id);

        context.ProfileProjects.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
