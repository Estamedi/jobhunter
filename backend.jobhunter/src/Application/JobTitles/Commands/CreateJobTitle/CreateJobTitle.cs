using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.JobTitles.Commands.CreateJobTitle;

[Authorize]
public record CreateJobTitleCommand : IRequest<int>
{
    public required string Name { get; init; }
    public string? Description { get; init; }
}

public class CreateJobTitleCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateJobTitleCommand, int>
{
    public async Task<int> Handle(CreateJobTitleCommand request, CancellationToken cancellationToken)
    {
        var entity = new JobTitle
        {
            Name = request.Name,
            Description = request.Description
        };
        context.JobTitles.Add(entity);
        await context.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
