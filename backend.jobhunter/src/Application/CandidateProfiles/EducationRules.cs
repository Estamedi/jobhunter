namespace backend.jobhunter.Application.CandidateProfiles;

// Fields shared by the add, update and import of an education entry.
public interface IEducationInput
{
    string Institution { get; }
    string Degree { get; }
    string? FieldOfStudy { get; }
    string? Location { get; }
    DateOnly? StartDate { get; }
    DateOnly? EndDate { get; }
    string? Details { get; }
}

public static class EducationRules
{
    public static void Apply<T>(AbstractValidator<T> validator) where T : IEducationInput
    {
        validator.RuleFor(x => x.Institution).NotEmpty().MaximumLength(200);
        validator.RuleFor(x => x.Degree).NotEmpty().MaximumLength(200);
        validator.RuleFor(x => x.FieldOfStudy).MaximumLength(200);
        validator.RuleFor(x => x.Location).MaximumLength(200);
        validator.RuleFor(x => x.Details).MaximumLength(2000);
        validator.RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate!.Value)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("End date cannot be before the start date.");
    }
}
