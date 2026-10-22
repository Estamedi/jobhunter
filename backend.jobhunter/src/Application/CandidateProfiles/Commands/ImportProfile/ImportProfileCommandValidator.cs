namespace backend.jobhunter.Application.CandidateProfiles.Commands.ImportProfile;

public class ImportedExperienceValidator : AbstractValidator<ImportedExperience>
{
    public ImportedExperienceValidator() => ExperienceRules.Apply(this);
}

public class ImportProfileCommandValidator : AbstractValidator<ImportProfileCommand>
{
    public ImportProfileCommandValidator()
    {
        RuleFor(x => x.CandidateId).GreaterThan(0);
        RuleFor(x => x.Mode)
            .Must(m => string.Equals(m, "Merge", StringComparison.OrdinalIgnoreCase)
                       || string.Equals(m, "Replace", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Mode must be Merge or Replace.");
        RuleFor(x => x.Headline).MaximumLength(220);
        RuleFor(x => x.Summary).MaximumLength(2600);
        RuleFor(x => x.Experiences).Must(e => e.Count <= 30).WithMessage("At most 30 experiences can be imported at once.");
        RuleForEach(x => x.Experiences).SetValidator(new ImportedExperienceValidator());
    }
}
