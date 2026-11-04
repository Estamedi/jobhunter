using System.Text;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Constants;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Settings.Commands.SetAiProviderKey;

/// <summary>Saves the API key for one provider. It is stored encrypted and wins over the key in server config.</summary>
[Authorize(Roles = Roles.Administrator)]
public sealed record SetAiProviderKeyCommand(string Provider, string ApiKey) : IRequest
{
    // The pipeline prints the request when something fails or runs slowly, so the key must never be part of it.
    private bool PrintMembers(StringBuilder builder)
    {
        builder.Append($"Provider = {Provider}, ApiKey = ***");
        return true;
    }
}

public class SetAiProviderKeyCommandValidator : AbstractValidator<SetAiProviderKeyCommand>
{
    // An encrypted key must fit the 500 characters of an AppSettings value; 200 leaves room to spare.
    public const int MaxKeyLength = 200;

    public SetAiProviderKeyCommandValidator(IAiProviderCatalog catalog)
    {
        RuleFor(x => x.Provider)
            .Must(p => catalog.Providers.Any(c => c.Name == p))
            .WithMessage("Unknown AI provider.");

        // The key goes into an HTTP header, so anything that could break the header is refused.
        RuleFor(x => x.ApiKey)
            .NotEmpty().WithMessage("Enter the API key.")
            .MaximumLength(MaxKeyLength).WithMessage($"The API key is too long (at most {MaxKeyLength} characters).")
            .Must(k => string.IsNullOrEmpty(k) || k.Trim().All(c => !char.IsWhiteSpace(c) && !char.IsControl(c)))
            .WithMessage("The API key must not contain spaces or line breaks.");
    }
}

public class SetAiProviderKeyCommandHandler(IApplicationDbContext context, IAiKeyProtector protector)
    : IRequestHandler<SetAiProviderKeyCommand>
{
    public async Task Handle(SetAiProviderKeyCommand request, CancellationToken cancellationToken)
    {
        var key = AiSettingKeys.ApiKey(request.Provider);
        var protectedKey = protector.Protect(request.ApiKey.Trim());

        var setting = await context.AppSettings.FirstOrDefaultAsync(s => s.Key == key, cancellationToken);
        if (setting is null) context.AppSettings.Add(new AppSetting { Key = key, Value = protectedKey });
        else setting.Value = protectedKey;

        await context.SaveChangesAsync(cancellationToken);
    }
}
