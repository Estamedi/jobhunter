namespace backend.jobhunter.Application.CandidateProfiles;

// Fields shared by the add, update and import of a certification.
public interface ICertificationInput
{
    string Name { get; }
    string? Issuer { get; }
    DateOnly? IssuedDate { get; }
    DateOnly? ExpiryDate { get; }
    string? CredentialUrl { get; }
}

public static class CertificationRules
{
    public static void Apply<T>(AbstractValidator<T> validator) where T : ICertificationInput
    {
        validator.RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        validator.RuleFor(x => x.Issuer).MaximumLength(200);
        validator.RuleFor(x => x.CredentialUrl).MaximumLength(500);
        validator.RuleFor(x => x.ExpiryDate).GreaterThanOrEqualTo(x => x.IssuedDate!.Value)
            .When(x => x.IssuedDate.HasValue && x.ExpiryDate.HasValue)
            .WithMessage("Expiry date cannot be before the issue date.");
    }
}
