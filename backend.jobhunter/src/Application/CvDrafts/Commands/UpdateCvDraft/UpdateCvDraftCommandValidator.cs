namespace backend.jobhunter.Application.CvDrafts.Commands.UpdateCvDraft;

public class UpdateCvDraftCommandValidator : AbstractValidator<UpdateCvDraftCommand>
{
    public UpdateCvDraftCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.TemplateId).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Content).NotNull();
    }
}
