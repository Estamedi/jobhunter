namespace backend.jobhunter.Application.CandidateProfiles.Commands.ImportProfile;

public class ImportedExperienceValidator : AbstractValidator<ImportedExperience>
{
    public ImportedExperienceValidator() => ExperienceRules.Apply(this);
}

public class ImportedEducationValidator : AbstractValidator<ImportedEducation>
{
    public ImportedEducationValidator() => EducationRules.Apply(this);
}

public class ImportedSkillValidator : AbstractValidator<ImportedSkill>
{
    public ImportedSkillValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Category).MaximumLength(100);
    }
}

public class ImportedProjectValidator : AbstractValidator<ImportedProject>
{
    public ImportedProjectValidator() => ProjectRules.Apply(this);
}

public class ImportedCertificationValidator : AbstractValidator<ImportedCertification>
{
    public ImportedCertificationValidator() => CertificationRules.Apply(this);
}

public class ImportedLanguageValidator : AbstractValidator<ImportedLanguage>
{
    public ImportedLanguageValidator() => LanguageRules.Apply(this);
}

public class ImportedLinkValidator : AbstractValidator<ImportedLink>
{
    public ImportedLinkValidator() => LinkRules.Apply(this);
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
        RuleFor(x => x.Educations).Must(e => e.Count <= 20).WithMessage("At most 20 education entries can be imported at once.");
        RuleForEach(x => x.Educations).SetValidator(new ImportedEducationValidator());
        RuleFor(x => x.Skills).Must(s => s.Count <= 100).WithMessage("At most 100 skills can be imported at once.");
        RuleForEach(x => x.Skills).SetValidator(new ImportedSkillValidator());
        RuleFor(x => x.Projects).Must(p => p.Count <= 30).WithMessage("At most 30 projects can be imported at once.");
        RuleForEach(x => x.Projects).SetValidator(new ImportedProjectValidator());
        RuleFor(x => x.Certifications).Must(c => c.Count <= 30).WithMessage("At most 30 certifications can be imported at once.");
        RuleForEach(x => x.Certifications).SetValidator(new ImportedCertificationValidator());
        RuleFor(x => x.Languages).Must(l => l.Count <= 20).WithMessage("At most 20 languages can be imported at once.");
        RuleForEach(x => x.Languages).SetValidator(new ImportedLanguageValidator());
        RuleFor(x => x.Links).Must(l => l.Count <= 20).WithMessage("At most 20 links can be imported at once.");
        RuleForEach(x => x.Links).SetValidator(new ImportedLinkValidator());
    }
}
