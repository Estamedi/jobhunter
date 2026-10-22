namespace backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileCertification;

public class AddProfileCertificationCommandValidator : AbstractValidator<AddProfileCertificationCommand>
{
    public AddProfileCertificationCommandValidator()
    {
        RuleFor(x => x.CandidateId).GreaterThan(0);
        CertificationRules.Apply(this);
    }
}
