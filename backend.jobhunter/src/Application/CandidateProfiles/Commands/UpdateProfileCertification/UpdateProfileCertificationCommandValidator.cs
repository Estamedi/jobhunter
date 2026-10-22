namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileCertification;

public class UpdateProfileCertificationCommandValidator : AbstractValidator<UpdateProfileCertificationCommand>
{
    public UpdateProfileCertificationCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        CertificationRules.Apply(this);
    }
}
