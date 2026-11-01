using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Constants;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Settings.Commands.UpdateAiProvider;

[Authorize(Roles = Roles.Administrator)]
public record UpdateAiProviderCommand(string Provider) : IRequest;

public class UpdateAiProviderCommandValidator : AbstractValidator<UpdateAiProviderCommand>
{
    public UpdateAiProviderCommandValidator(IAiProviderCatalog catalog)
    {
        RuleFor(x => x.Provider)
            .Must(p => catalog.Providers.Any(c => c.Name == p))
            .WithMessage("Unknown AI provider.");
    }
}

public class UpdateAiProviderCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateAiProviderCommand>
{
    public async Task Handle(UpdateAiProviderCommand request, CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings
            .FirstOrDefaultAsync(s => s.Key == AiSettingKeys.Provider, cancellationToken);

        if (setting is null)
            context.AppSettings.Add(new AppSetting { Key = AiSettingKeys.Provider, Value = request.Provider });
        else
            setting.Value = request.Provider;

        await context.SaveChangesAsync(cancellationToken);
    }
}
