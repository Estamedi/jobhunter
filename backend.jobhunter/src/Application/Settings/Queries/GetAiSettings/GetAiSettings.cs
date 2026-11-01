using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Constants;

namespace backend.jobhunter.Application.Settings.Queries.GetAiSettings;

public record AiSettingsDto(string Provider, IReadOnlyList<AiProviderInfo> Providers);

[Authorize(Roles = Roles.Administrator)]
public record GetAiSettingsQuery : IRequest<AiSettingsDto>;

public class GetAiSettingsQueryHandler(IApplicationDbContext context, IAiProviderCatalog catalog)
    : IRequestHandler<GetAiSettingsQuery, AiSettingsDto>
{
    public async Task<AiSettingsDto> Handle(GetAiSettingsQuery request, CancellationToken cancellationToken)
    {
        var saved = await context.AppSettings.AsNoTracking()
            .Where(s => s.Key == AiSettingKeys.Provider)
            .Select(s => s.Value)
            .FirstOrDefaultAsync(cancellationToken);

        var provider = catalog.Providers.Any(p => p.Name == saved) ? saved! : catalog.DefaultProvider;
        return new AiSettingsDto(provider, catalog.Providers);
    }
}
