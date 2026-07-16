namespace backend.jobhunter.Application.Users.Commands.UpdateOnboardingStatus;

public class UpdateOnboardingStatusCommandValidator : AbstractValidator<UpdateOnboardingStatusCommand>
{
    public UpdateOnboardingStatusCommandValidator()
    {
        RuleFor(x => x.Status)
            .Must(status => status is "Completed" or "Skipped")
            .WithMessage("Status must be Completed or Skipped.");
    }
}
