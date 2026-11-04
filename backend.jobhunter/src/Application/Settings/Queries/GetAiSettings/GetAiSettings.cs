using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Constants;

namespace backend.jobhunter.Application.Settings.Queries.GetAiSettings;

/// <summary>One AI action with its saved override (null = use the default provider/model) and the default model per provider.</summary>
public record AiActionSettingDto(
    string Action, string Label, string Description, string? Provider, string? Model,
    IReadOnlyDictionary<string, string> DefaultModels);

/// <summary>
/// Whether a provider can be used and where its key comes from: "settings" (saved by an administrator), "config"
/// (server configuration) or null. Never the key itself; Hint is the last 4 characters of a saved key.
/// </summary>
public record AiProviderStatusDto(string Name, bool Configured, string? Source, string? Hint, bool SavedKeyUnreadable);

public record AiSettingsDto(string Provider, IReadOnlyList<AiProviderStatusDto> Providers, IReadOnlyList<AiActionSettingDto> Actions);

[Authorize(Roles = Roles.Administrator)]
public record GetAiSettingsQuery : IRequest<AiSettingsDto>;

public class GetAiSettingsQueryHandler(IApplicationDbContext context, IAiProviderCatalog catalog, IAiKeyProtector protector)
    : IRequestHandler<GetAiSettingsQuery, AiSettingsDto>
{
    public async Task<AiSettingsDto> Handle(GetAiSettingsQuery request, CancellationToken cancellationToken)
    {
        var saved = await context.AppSettings.AsNoTracking()
            .Where(s => s.Key.StartsWith("Ai."))
            .ToDictionaryAsync(s => s.Key, s => s.Value, cancellationToken);

        var providers = catalog.Providers.Select(c =>
        {
            if (!saved.TryGetValue(AiSettingKeys.ApiKey(c.Name), out var protectedKey))
            {
                return new AiProviderStatusDto(c.Name, c.Configured, c.Configured ? "config" : null, null, false);
            }
            if (protector.TryUnprotect(protectedKey, out var plain) && !string.IsNullOrWhiteSpace(plain))
            {
                var hint = plain.Length > 4 ? plain[^4..] : null;
                return new AiProviderStatusDto(c.Name, true, "settings", hint, false);
            }
            // The saved key cannot be decrypted (the encryption keys changed), so it is not used.
            return new AiProviderStatusDto(c.Name, c.Configured, c.Configured ? "config" : null, null, true);
        }).ToList();

        var provider = saved.TryGetValue(AiSettingKeys.Provider, out var p) && catalog.Providers.Any(c => c.Name == p)
            ? p : catalog.DefaultProvider;

        var actions = AiActions.All.Select(a =>
        {
            saved.TryGetValue(AiSettingKeys.ActionProvider(a.Key), out var actionProvider);
            saved.TryGetValue(AiSettingKeys.ActionModel(a.Key), out var model);
            return new AiActionSettingDto(
                a.Key, a.Label, a.Description,
                catalog.Providers.Any(c => c.Name == actionProvider) ? actionProvider : null,
                string.IsNullOrWhiteSpace(model) ? null : model,
                catalog.Providers.ToDictionary(c => c.Name, c => catalog.DefaultModel(c.Name, a.HeavyModel)));
        }).ToList();

        return new AiSettingsDto(provider, providers, actions);
    }
}
