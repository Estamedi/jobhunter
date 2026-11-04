using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Constants;

namespace backend.jobhunter.Application.Settings.Commands.RemoveAiProviderKey;

/// <summary>Removes the key saved for a provider, so the key in server config (if there is one) is used again.</summary>
[Authorize(Roles = Roles.Administrator)]
public record RemoveAiProviderKeyCommand(string Provider) : IRequest;

public class RemoveAiProviderKeyCommandValidator : AbstractValidator<RemoveAiProviderKeyCommand>
{
    public RemoveAiProviderKeyCommandValidator(IAiProviderCatalog catalog)
    {
        RuleFor(x => x.Provider)
            .Must(p => catalog.Providers.Any(c => c.Name == p))
            .WithMessage("Unknown AI provider.");
    }
}

public class RemoveAiProviderKeyCommandHandler(IApplicationDbContext context) : IRequestHandler<RemoveAiProviderKeyCommand>
{
    public async Task Handle(RemoveAiProviderKeyCommand request, CancellationToken cancellationToken)
    {
        var key = AiSettingKeys.ApiKey(request.Provider);
        var setting = await context.AppSettings.FirstOrDefaultAsync(s => s.Key == key, cancellationToken);
        if (setting is null) return;

        context.AppSettings.Remove(setting);
        await context.SaveChangesAsync(cancellationToken);
    }
}
