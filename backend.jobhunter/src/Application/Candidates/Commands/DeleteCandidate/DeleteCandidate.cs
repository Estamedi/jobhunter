using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Application.Common.Exceptions;

namespace backend.jobhunter.Application.Candidates.Commands.DeleteCandidate;

[Authorize]
public record DeleteCandidateCommand(int Id) : IRequest;

public class DeleteCandidateCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteCandidateCommand>
{
    public async Task Handle(DeleteCandidateCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Candidates.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("Candidate", request.Id);

        context.Candidates.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
