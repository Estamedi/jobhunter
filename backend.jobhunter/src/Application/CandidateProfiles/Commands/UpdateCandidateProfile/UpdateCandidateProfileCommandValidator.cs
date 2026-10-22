namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateCandidateProfile;

public class UpdateCandidateProfileCommandValidator : AbstractValidator<UpdateCandidateProfileCommand>
{
    public UpdateCandidateProfileCommandValidator()
    {
        RuleFor(x => x.CandidateId).GreaterThan(0);
        RuleFor(x => x.Headline).MaximumLength(220);
        RuleFor(x => x.Summary).MaximumLength(2600);
    }
}
