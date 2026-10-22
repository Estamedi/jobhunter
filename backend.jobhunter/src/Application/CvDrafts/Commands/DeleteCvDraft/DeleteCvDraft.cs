using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts.Commands.DeleteCvDraft;

[Authorize]
public record DeleteCvDraftCommand(int Id) : IRequest;

public class DeleteCvDraftCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteCvDraftCommand>
{
    public async Task Handle(DeleteCvDraftCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.CvDrafts.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(CvDraft), request.Id);

        context.CvDrafts.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
