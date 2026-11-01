namespace backend.jobhunter.Application.Cvs.Commands.UploadCv;

public class UploadCvCommandValidator : AbstractValidator<UploadCvCommand>
{
    public const long MaxFileSizeBytes = 10 * 1024 * 1024;

    public static readonly IReadOnlyDictionary<string, string> AllowedTypes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"] = "application/pdf",
        [".doc"] = "application/msword",
        [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    public UploadCvCommandValidator()
    {
        RuleFor(x => x.CandidateId).GreaterThan(0);

        RuleFor(x => x.FileName)
            .NotEmpty()
            .MaximumLength(255)
            .Must(name => AllowedTypes.ContainsKey(Path.GetExtension(name)))
            .WithMessage("Only PDF, DOC and DOCX files can be uploaded.");

        RuleFor(x => x.FileSizeBytes)
            .GreaterThan(0).WithMessage("The file is empty.")
            .LessThanOrEqualTo(MaxFileSizeBytes).WithMessage("The file must be 10 MB or smaller.");
    }
}
