using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.DeleteCandidatePhoto;

[Authorize]
public record DeleteCandidatePhotoCommand(int CandidateId) : IRequest;

public class DeleteCandidatePhotoCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteCandidatePhotoCommand>
{
    public async Task Handle(DeleteCandidatePhotoCommand request, CancellationToken cancellationToken)
    {
        // The candidate must be the signed-in user's; another user's id finds nothing and is a 404.
        if (!await context.Candidates.AnyAsync(c => c.Id == request.CandidateId, cancellationToken))
        {
            throw new NotFoundException(nameof(Candidate), request.CandidateId);
        }

        var photo = await context.CandidatePhotos.FirstOrDefaultAsync(p => p.CandidateId == request.CandidateId, cancellationToken);
        if (photo is null) return;

        context.CandidatePhotos.Remove(photo);
        await context.SaveChangesAsync(cancellationToken);
    }
}
