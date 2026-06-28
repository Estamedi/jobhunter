using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Interviews.Commands.DeleteInterview;

[Authorize]
public record DeleteInterviewCommand(int Id) : IRequest;

public class DeleteInterviewCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteInterviewCommand>
{
    public async Task Handle(DeleteInterviewCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Interviews.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("Interview", request.Id);

        context.Interviews.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
