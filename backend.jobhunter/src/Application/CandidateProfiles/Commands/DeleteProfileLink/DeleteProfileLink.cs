using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileLink;

[Authorize]
public record DeleteProfileLinkCommand(int Id) : IRequest;

public class DeleteProfileLinkCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteProfileLinkCommand>
{
    public async Task Handle(DeleteProfileLinkCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.ProfileLinks.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(ProfileLink), request.Id);

        context.ProfileLinks.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
