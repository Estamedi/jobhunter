namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileProject;

public class UpdateProfileProjectCommandValidator : AbstractValidator<UpdateProfileProjectCommand>
{
    public UpdateProfileProjectCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        ProjectRules.Apply(this);
    }
}
