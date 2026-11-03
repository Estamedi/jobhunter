using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileSkill;

[Authorize]
public record AddProfileSkillCommand : IRequest<int>, ISkillInput
{
    public required int CandidateId { get; init; }
    public required string Name { get; init; }
    public string? Category { get; init; }
    public string? EvidenceLevel { get; init; }
    public string? Note { get; init; }
}

public class AddProfileSkillCommandHandler(IApplicationDbContext context)
    : IRequestHandler<AddProfileSkillCommand, int>
{
    public async Task<int> Handle(AddProfileSkillCommand request, CancellationToken cancellationToken)
    {
        var profile = await context.GetOrCreateAsync(request.CandidateId, cancellationToken);
        var name = request.Name.Trim();
        var level = CandidateProfileMapping.ParseEnum<SkillEvidenceLevel>(request.EvidenceLevel);
        var note = SkillRules.CleanNote(request.Note);

        // Adding a skill that is already on the profile returns the existing one. A level or note sent with
        // it is applied to that skill; without either, nothing changes.
        if (profile.Id != 0)
        {
            var existing = await context.ProfileSkills
                .FirstOrDefaultAsync(s => s.ProfileId == profile.Id && s.Name.ToLower() == name.ToLower(), cancellationToken);
            if (existing is not null)
            {
                if (level.HasValue || note is not null)
                {
                    existing.EvidenceLevel = level ?? existing.EvidenceLevel;
                    existing.Note = note ?? existing.Note;
                    await context.SaveChangesAsync(cancellationToken);
                }
                return existing.Id;
            }
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
            EvidenceLevel = level,
            Note = note,
            SortOrder = nextOrder,
        };

        context.ProfileSkills.Add(entity);
        await context.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}
