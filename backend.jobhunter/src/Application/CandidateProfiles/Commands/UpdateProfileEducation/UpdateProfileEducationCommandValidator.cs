namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileEducation;

public class UpdateProfileEducationCommandValidator : AbstractValidator<UpdateProfileEducationCommand>
{
    public UpdateProfileEducationCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        EducationRules.Apply(this);
    }
}
