using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.JobApplications.Commands.DeleteJobApplication;

[Authorize]
public record DeleteJobApplicationCommand(int Id) : IRequest;

public class DeleteJobApplicationCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteJobApplicationCommand>
{
    public async Task Handle(DeleteJobApplicationCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Applications.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("JobApplication", request.Id);

        context.Applications.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
