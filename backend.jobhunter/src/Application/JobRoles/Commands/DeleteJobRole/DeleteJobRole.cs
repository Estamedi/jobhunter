using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.JobRoles.Commands.DeleteJobRole;

[Authorize]
public record DeleteJobRoleCommand(int Id) : IRequest;

public class DeleteJobRoleCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteJobRoleCommand>
{
    public async Task Handle(DeleteJobRoleCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.JobRoles.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("JobRole", request.Id);

        context.JobRoles.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
