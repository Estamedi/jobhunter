namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateCandidateContact;

public class UpdateCandidateContactCommandValidator : AbstractValidator<UpdateCandidateContactCommand>
{
    public UpdateCandidateContactCommandValidator()
    {
        RuleFor(x => x.CandidateId).GreaterThan(0);
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.Phone).MaximumLength(50);
        RuleFor(x => x.CurrentLocation).MaximumLength(200);
    }
}
