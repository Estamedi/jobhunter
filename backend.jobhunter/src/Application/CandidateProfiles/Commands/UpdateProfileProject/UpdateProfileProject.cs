using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileProject;

[Authorize]
public record UpdateProfileProjectCommand : IRequest, IProjectInput
{
    public required int Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public string? Url { get; init; }
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
}

public class UpdateProfileProjectCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateProfileProjectCommand>
{
    public async Task Handle(UpdateProfileProjectCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.ProfileProjects.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(ProfileProject), request.Id);

        entity.Name = request.Name.Trim();
        entity.Description = request.Description?.Trim();
        entity.Url = request.Url?.Trim();
        entity.StartDate = request.StartDate;
        entity.EndDate = request.EndDate;

        await context.SaveChangesAsync(cancellationToken);
    }
}
