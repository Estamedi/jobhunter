using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.JobTitles.Commands.DeleteJobTitle;

[Authorize]
public record DeleteJobTitleCommand(int Id) : IRequest;

public class DeleteJobTitleCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteJobTitleCommand>
{
    public async Task Handle(DeleteJobTitleCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.JobTitles.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("JobTitle", request.Id);

        context.JobTitles.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
