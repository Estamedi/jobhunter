using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.CandidateProfiles;

// Fields shared by the add and update experience commands (LinkedIn's "Edit experience" form).
public interface IExperienceInput
{
    string Title { get; }
    string? EmploymentType { get; }
    string Company { get; }
    bool IsCurrent { get; }
    DateOnly StartDate { get; }
    DateOnly? EndDate { get; }
    string? Location { get; }
    string? WorkplaceType { get; }
    string? Description { get; }
    IReadOnlyList<string>? Skills { get; }
}

public static class ExperienceRules
{
    public static void Apply<T>(AbstractValidator<T> validator) where T : IExperienceInput
    {
        validator.RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        validator.RuleFor(x => x.Company).NotEmpty().MaximumLength(200);
        validator.RuleFor(x => x.StartDate).NotEmpty();
        validator.RuleFor(x => x.EmploymentType)
            .Must(v => string.IsNullOrWhiteSpace(v) || Enum.TryParse<EmploymentType>(v, true, out _))
            .WithMessage("Unknown employment type.");
        validator.RuleFor(x => x.WorkplaceType)
            .Must(v => string.IsNullOrWhiteSpace(v) || Enum.TryParse<WorkplaceType>(v, true, out _))
            .WithMessage("Unknown workplace type.");
        validator.RuleFor(x => x.EndDate)
            .Null().When(x => x.IsCurrent)
            .WithMessage("A current role cannot have an end date.");
        validator.RuleFor(x => x.EndDate)
            .NotNull().When(x => !x.IsCurrent)
            .WithMessage("End date is required unless this is your current role.");
        validator.RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate).When(x => x.EndDate.HasValue)
            .WithMessage("End date cannot be before the start date.");
        validator.RuleFor(x => x.Location).MaximumLength(200);
        validator.RuleFor(x => x.Description).MaximumLength(2000);
        validator.RuleFor(x => x.Skills!)
            .Must(s => s.Count <= 50).When(x => x.Skills is not null)
            .WithMessage("A role can have at most 50 skills.");
        validator.RuleForEach(x => x.Skills!).MaximumLength(100).When(x => x.Skills is not null);
    }
}
