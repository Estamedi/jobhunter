namespace backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileProject;

public class AddProfileProjectCommandValidator : AbstractValidator<AddProfileProjectCommand>
{
    public AddProfileProjectCommandValidator()
    {
        RuleFor(x => x.CandidateId).GreaterThan(0);
        ProjectRules.Apply(this);
    }
}
