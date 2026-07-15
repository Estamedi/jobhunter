using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Notes.Commands.DeleteNote;

[Authorize]
public record DeleteNoteCommand(int Id) : IRequest;

public class DeleteNoteCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteNoteCommand>
{
    public async Task Handle(DeleteNoteCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Notes.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(Note), request.Id);

        context.Notes.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
