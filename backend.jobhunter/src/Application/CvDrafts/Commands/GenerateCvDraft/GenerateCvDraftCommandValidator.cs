namespace backend.jobhunter.Application.CvDrafts.Commands.GenerateCvDraft;

public class GenerateCvDraftCommandValidator : AbstractValidator<GenerateCvDraftCommand>
{
    public GenerateCvDraftCommandValidator()
    {
        RuleFor(x => x.CandidateId).GreaterThan(0);
        RuleFor(x => x.JobTitle).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Title).MaximumLength(200);
        RuleFor(x => x.JobDescription).MaximumLength(20000);
        RuleFor(x => x.Instructions).MaximumLength(4000);
        RuleFor(x => x.BackgroundText).MaximumLength(20000);
        RuleFor(x => x.TemplateId).MaximumLength(50);
        RuleFor(x => x.Tone).MaximumLength(50);
        RuleFor(x => x.Language).MaximumLength(50);
    }
}
