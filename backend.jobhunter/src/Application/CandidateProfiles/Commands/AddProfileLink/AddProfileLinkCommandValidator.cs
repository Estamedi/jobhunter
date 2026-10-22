namespace backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileLink;

public class AddProfileLinkCommandValidator : AbstractValidator<AddProfileLinkCommand>
{
    public AddProfileLinkCommandValidator()
    {
        RuleFor(x => x.CandidateId).GreaterThan(0);
        LinkRules.Apply(this);
    }
}
