using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileEducation;

[Authorize]
public record DeleteProfileEducationCommand(int Id) : IRequest;

public class DeleteProfileEducationCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteProfileEducationCommand>
{
    public async Task Handle(DeleteProfileEducationCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.ProfileEducations.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(ProfileEducation), request.Id);

        context.ProfileEducations.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
