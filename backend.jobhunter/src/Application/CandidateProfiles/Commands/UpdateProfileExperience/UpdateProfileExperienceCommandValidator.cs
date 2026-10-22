namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileExperience;

public class UpdateProfileExperienceCommandValidator : AbstractValidator<UpdateProfileExperienceCommand>
{
    public UpdateProfileExperienceCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        ExperienceRules.Apply(this);
    }
}
