namespace backend.jobhunter.Application.JobApplications.Commands.AttachCvToJobApplication;

public class AttachCvToJobApplicationCommandValidator : AbstractValidator<AttachCvToJobApplicationCommand>
{
    public AttachCvToJobApplicationCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.CvId).GreaterThan(0);
    }
}
