namespace backend.jobhunter.Application.Users.Commands.SetPassword;

public class SetPasswordCommandValidator : AbstractValidator<SetPasswordCommand>
{
    public SetPasswordCommandValidator()
    {
        RuleFor(x => x.NewPassword).NotEmpty();
    }
}
