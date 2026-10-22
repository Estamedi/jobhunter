namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileLanguage;

public class UpdateProfileLanguageCommandValidator : AbstractValidator<UpdateProfileLanguageCommand>
{
    public UpdateProfileLanguageCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        LanguageRules.Apply(this);
    }
}
