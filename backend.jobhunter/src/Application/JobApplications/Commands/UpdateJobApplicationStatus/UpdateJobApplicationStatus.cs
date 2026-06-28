using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.JobApplications.Commands.UpdateJobApplicationStatus;

[Authorize]
public record UpdateJobApplicationStatusCommand(int Id, string Status) : IRequest;

public class UpdateJobApplicationStatusCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateJobApplicationStatusCommand>
{
    public async Task Handle(UpdateJobApplicationStatusCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Applications.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("JobApplication", request.Id);

        entity.Status = request.Status;
        entity.LastActivityDate = DateTimeOffset.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
    }
}
