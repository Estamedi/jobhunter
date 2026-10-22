namespace backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileSkill;

public class AddProfileSkillCommandValidator : AbstractValidator<AddProfileSkillCommand>
{
    public AddProfileSkillCommandValidator()
    {
        RuleFor(x => x.CandidateId).GreaterThan(0);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Category).MaximumLength(100);
    }
}
