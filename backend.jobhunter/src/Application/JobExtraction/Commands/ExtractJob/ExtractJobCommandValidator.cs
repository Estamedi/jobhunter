namespace backend.jobhunter.Application.JobExtraction.Commands.ExtractJob;

public class ExtractJobCommandValidator : AbstractValidator<ExtractJobCommand>
{
    public ExtractJobCommandValidator()
    {
        RuleFor(x => x.Url).NotEmpty();
        RuleFor(x => x.Title).NotNull();
        RuleFor(x => x.Text).NotEmpty();
    }
}
