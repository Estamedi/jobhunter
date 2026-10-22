namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileLink;

public class UpdateProfileLinkCommandValidator : AbstractValidator<UpdateProfileLinkCommand>
{
    public UpdateProfileLinkCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        LinkRules.Apply(this);
    }
}
