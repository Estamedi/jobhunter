using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.JobTitles.Commands.UpdateJobTitle;

[Authorize]
public record UpdateJobTitleCommand : IRequest
{
    public required int Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
}

public class UpdateJobTitleCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateJobTitleCommand>
{
    public async Task Handle(UpdateJobTitleCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.JobTitles.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("JobTitle", request.Id);

        entity.Name = request.Name;
        entity.Description = request.Description;

        await context.SaveChangesAsync(cancellationToken);
    }
}
