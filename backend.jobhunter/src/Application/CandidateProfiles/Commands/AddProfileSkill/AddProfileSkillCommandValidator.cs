namespace backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileSkill;

public class AddProfileSkillCommandValidator : AbstractValidator<AddProfileSkillCommand>
{
    public AddProfileSkillCommandValidator()
    {
        RuleFor(x => x.CandidateId).GreaterThan(0);
        SkillRules.Apply(this);
    }
}
