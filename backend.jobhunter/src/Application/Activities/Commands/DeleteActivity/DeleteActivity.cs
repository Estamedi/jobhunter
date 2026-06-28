using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Activities.Commands.DeleteActivity;

[Authorize]
public record DeleteActivityCommand(int Id) : IRequest;

public class DeleteActivityCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteActivityCommand>
{
    public async Task Handle(DeleteActivityCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Activities.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("Activity", request.Id);

        context.Activities.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
