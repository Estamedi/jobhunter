using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Activities.Commands.UpdateActivity;

[Authorize]
public record UpdateActivityCommand : IRequest
{
    public required int Id { get; init; }
    public string Type { get; init; } = "Note";
    public DateTimeOffset ActivityDate { get; init; } = DateTimeOffset.UtcNow;
    public string? Outcome { get; init; }
    public string? Notes { get; init; }
    public int? ContactId { get; init; }
}

public class UpdateActivityCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateActivityCommand>
{
    public async Task Handle(UpdateActivityCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Activities.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("Activity", request.Id);

        entity.Type = request.Type;
        entity.ActivityDate = request.ActivityDate;
        entity.Outcome = request.Outcome;
        entity.Notes = request.Notes;
        entity.ContactId = request.ContactId;

        await context.SaveChangesAsync(cancellationToken);
    }
}
