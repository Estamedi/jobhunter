using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileSkill;

[Authorize]
public record AddProfileSkillCommand : IRequest<int>
{
    public required int CandidateId { get; init; }
    public required string Name { get; init; }
    public string? Category { get; init; }
}

public class AddProfileSkillCommandHandler(IApplicationDbContext context)
    : IRequestHandler<AddProfileSkillCommand, int>
{
    public async Task<int> Handle(AddProfileSkillCommand request, CancellationToken cancellationToken)
    {
        var profile = await context.GetOrCreateAsync(request.CandidateId, cancellationToken);
        var name = request.Name.Trim();

        // Adding a skill that is already on the profile is a no-op that returns the existing one.
        if (profile.Id != 0)
        {
            var existing = await context.ProfileSkills
                .Where(s => s.ProfileId == profile.Id && s.Name.ToLower() == name.ToLower())
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (existing.HasValue) return existing.Value;
        }

        var nextOrder = profile.Id == 0
            ? 0
            : (await context.ProfileSkills.Where(s => s.ProfileId == profile.Id)
                .MaxAsync(s => (int?)s.SortOrder, cancellationToken) ?? -1) + 1;

        var entity = new ProfileSkill
        {
            Profile = profile,
            Name = name,
            Category = string.IsNullOrWhiteSpace(request.Category) ? null : request.Category.Trim(),
            SortOrder = nextOrder,
        };

        context.ProfileSkills.Add(entity);
        await context.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}
