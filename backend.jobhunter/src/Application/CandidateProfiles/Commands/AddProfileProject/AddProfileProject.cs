using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileProject;

[Authorize]
public record AddProfileProjectCommand : IRequest<int>, IProjectInput
{
    public required int CandidateId { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public string? Url { get; init; }
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
}

public class AddProfileProjectCommandHandler(IApplicationDbContext context)
    : IRequestHandler<AddProfileProjectCommand, int>
{
    public async Task<int> Handle(AddProfileProjectCommand request, CancellationToken cancellationToken)
    {
        var profile = await context.GetOrCreateAsync(request.CandidateId, cancellationToken);

        var entity = new ProfileProject
        {
            Profile = profile,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Url = request.Url?.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            SortOrder = profile.Id == 0
                ? 0
                : (await context.ProfileProjects.Where(x => x.ProfileId == profile.Id)
                    .MaxAsync(x => (int?)x.SortOrder, cancellationToken) ?? -1) + 1,
        };

        context.ProfileProjects.Add(entity);
        await context.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}
