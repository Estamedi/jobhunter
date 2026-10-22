namespace backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileExperience;

public class AddProfileExperienceCommandValidator : AbstractValidator<AddProfileExperienceCommand>
{
    public AddProfileExperienceCommandValidator()
    {
        RuleFor(x => x.CandidateId).GreaterThan(0);
        ExperienceRules.Apply(this);
    }
}
