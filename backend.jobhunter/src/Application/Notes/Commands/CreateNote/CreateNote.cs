using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Notes.Commands.CreateNote;

[Authorize]
public record CreateNoteCommand : IRequest<int>
{
    public required string Content { get; init; }
    public int? ApplicationId { get; init; }
}

public class CreateNoteCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateNoteCommand, int>
{
    public async Task<int> Handle(CreateNoteCommand request, CancellationToken cancellationToken)
    {
        if (request.ApplicationId is int applicationId)
        {
            var applicationExists = await context.Applications.AnyAsync(a => a.Id == applicationId, cancellationToken);
            if (!applicationExists)
            {
                throw new NotFoundException(nameof(JobApplication), applicationId);
            }
        }

        var entity = new Note
        {
            Content = request.Content,
            ApplicationId = request.ApplicationId,
        };

        context.Notes.Add(entity);
        await context.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}
