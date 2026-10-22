namespace backend.jobhunter.Application.CandidateProfiles;

// Fields shared by the add, update and import of a link.
public interface ILinkInput
{
    string Label { get; }
    string Url { get; }
}

public static class LinkRules
{
    public static void Apply<T>(AbstractValidator<T> validator) where T : ILinkInput
    {
        validator.RuleFor(x => x.Label).NotEmpty().MaximumLength(100);
        validator.RuleFor(x => x.Url).NotEmpty().MaximumLength(500);
    }
}
