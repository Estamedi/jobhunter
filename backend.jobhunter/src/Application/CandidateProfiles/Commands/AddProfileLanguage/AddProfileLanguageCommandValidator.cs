namespace backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileLanguage;

public class AddProfileLanguageCommandValidator : AbstractValidator<AddProfileLanguageCommand>
{
    public AddProfileLanguageCommandValidator()
    {
        RuleFor(x => x.CandidateId).GreaterThan(0);
        LanguageRules.Apply(this);
    }
}
