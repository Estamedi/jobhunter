using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Application.Common.Exceptions;

namespace backend.jobhunter.Application.Candidates.Commands.ArchiveCandidate;

[Authorize]
public record ArchiveCandidateCommand(int Id, bool IsActive) : IRequest;

public class ArchiveCandidateCommandHandler(IApplicationDbContext context)
    : IRequestHandler<ArchiveCandidateCommand>
{
    public async Task Handle(ArchiveCandidateCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Candidates.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("Candidate", request.Id);

        entity.IsActive = request.IsActive;
        await context.SaveChangesAsync(cancellationToken);
    }
}
