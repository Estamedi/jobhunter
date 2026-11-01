namespace backend.jobhunter.Application.JobExtraction.Commands.ExtractJob;

public class ExtractJobCommandValidator : AbstractValidator<ExtractJobCommand>
{
    public ExtractJobCommandValidator()
    {
        RuleFor(x => x.Url).NotEmpty().MaximumLength(8192);
        RuleFor(x => x.Title).NotNull().MaximumLength(2000);
        RuleFor(x => x.JsonLd).MaximumLength(500000);
        RuleFor(x => x.Text).NotEmpty().MaximumLength(200000);
    }
}
