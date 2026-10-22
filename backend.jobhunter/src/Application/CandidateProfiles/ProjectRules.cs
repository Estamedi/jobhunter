namespace backend.jobhunter.Application.CandidateProfiles;

// Fields shared by the add, update and import of a project.
public interface IProjectInput
{
    string Name { get; }
    string? Description { get; }
    string? Url { get; }
    DateOnly? StartDate { get; }
    DateOnly? EndDate { get; }
}

public static class ProjectRules
{
    public static void Apply<T>(AbstractValidator<T> validator) where T : IProjectInput
    {
        validator.RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        validator.RuleFor(x => x.Description).MaximumLength(2000);
        validator.RuleFor(x => x.Url).MaximumLength(500);
        validator.RuleFor(x => x.EndDate).GreaterThanOrEqualTo(x => x.StartDate!.Value)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("End date cannot be before the start date.");
    }
}
