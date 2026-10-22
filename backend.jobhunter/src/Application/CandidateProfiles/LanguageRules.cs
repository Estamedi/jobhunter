using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.CandidateProfiles;

// Fields shared by the add, update and import of a language.
public interface ILanguageInput
{
    string Name { get; }
    string Proficiency { get; }
}

public static class LanguageRules
{
    public static void Apply<T>(AbstractValidator<T> validator) where T : ILanguageInput
    {
        validator.RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        validator.RuleFor(x => x.Proficiency).Must(v => Enum.TryParse<LanguageProficiency>(v, true, out _)).WithMessage("Unknown proficiency.");
    }
}
