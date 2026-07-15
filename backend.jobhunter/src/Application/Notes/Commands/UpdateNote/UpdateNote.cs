using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Notes.Commands.UpdateNote;

[Authorize]
public record UpdateNoteCommand : IRequest
{
    public required int Id { get; init; }
    public required string Content { get; init; }
    public int? ApplicationId { get; init; }
}

public class UpdateNoteCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateNoteCommand>
{
    public async Task Handle(UpdateNoteCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Notes.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(Note), request.Id);

        if (request.ApplicationId is int applicationId)
        {
            var applicationExists = await context.Applications.AnyAsync(a => a.Id == applicationId, cancellationToken);
            if (!applicationExists)
            {
                throw new NotFoundException(nameof(JobApplication), applicationId);
            }
        }

        entity.Content = request.Content;
        entity.ApplicationId = request.ApplicationId;

        await context.SaveChangesAsync(cancellationToken);
    }
}
