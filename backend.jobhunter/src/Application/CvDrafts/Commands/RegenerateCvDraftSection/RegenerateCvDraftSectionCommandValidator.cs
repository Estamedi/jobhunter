namespace backend.jobhunter.Application.CvDrafts.Commands.RegenerateCvDraftSection;

public class RegenerateCvDraftSectionCommandValidator : AbstractValidator<RegenerateCvDraftSectionCommand>
{
    public RegenerateCvDraftSectionCommandValidator()
    {
        RuleFor(x => x.Section)
            .NotEmpty()
            .Must(s => CvSections.All.Contains(s.ToLowerInvariant()))
            .WithMessage($"Section must be one of: {string.Join(", ", CvSections.All)}.");
        RuleFor(x => x.Instruction).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.BackgroundText).MaximumLength(20000);
    }
}
