using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileSkill;

[Authorize]
public record UpdateProfileSkillCommand : IRequest, ISkillInput
{
    public required int Id { get; init; }
    public required string Name { get; init; }
    public string? Category { get; init; }
    public string? EvidenceLevel { get; init; }
    public string? Note { get; init; }
}

public class UpdateProfileSkillCommandValidator : AbstractValidator<UpdateProfileSkillCommand>
{
    public UpdateProfileSkillCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        SkillRules.Apply(this);
    }
}

public class UpdateProfileSkillCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateProfileSkillCommand>
{
    public async Task Handle(UpdateProfileSkillCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.ProfileSkills.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(ProfileSkill), request.Id);

        entity.Name = request.Name.Trim();
        entity.Category = string.IsNullOrWhiteSpace(request.Category) ? null : request.Category.Trim();
        entity.EvidenceLevel = CandidateProfileMapping.ParseEnum<SkillEvidenceLevel>(request.EvidenceLevel);
        entity.Note = SkillRules.CleanNote(request.Note);

        await context.SaveChangesAsync(cancellationToken);
    }
}
