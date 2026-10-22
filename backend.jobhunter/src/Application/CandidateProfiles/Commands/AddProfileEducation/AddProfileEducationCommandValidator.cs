namespace backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileEducation;

public class AddProfileEducationCommandValidator : AbstractValidator<AddProfileEducationCommand>
{
    public AddProfileEducationCommandValidator()
    {
        RuleFor(x => x.CandidateId).GreaterThan(0);
        EducationRules.Apply(this);
    }
}
