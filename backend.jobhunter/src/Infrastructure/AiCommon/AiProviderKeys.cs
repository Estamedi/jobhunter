using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Constants;
using backend.jobhunter.Infrastructure.AiExtraction;

namespace backend.jobhunter.Infrastructure.AiCommon;

// Which API key each provider really has. One place decides this, so a real AI call and the model list on
// the settings page always agree: a key an administrator saved wins over the one in server config, and a saved
// key that cannot be read is skipped.
public static class AiProviderKeys
{
    /// <summary>The AppSettings keys that hold a saved (encrypted) key, one per provider.</summary>
    public static IEnumerable<string> SavedSettingKeys => AiExtractionOptions.Providers.Select(AiSettingKeys.ApiKey);

    /// <summary>Only providers that have a usable key are in the result.</summary>
    public static Dictionary<string, string> Effective(
        AiExtractionOptions options, IReadOnlyDictionary<string, string> savedSettings, IAiKeyProtector? protector)
    {
        var keys = AiExtractionOptions.Providers
            .Where(options.IsConfigured)
            .ToDictionary(p => p, p => options.ConfigKey(p)!.Trim());

        if (protector is null) return keys;

        foreach (var provider in AiExtractionOptions.Providers)
        {
            if (savedSettings.TryGetValue(AiSettingKeys.ApiKey(provider), out var protectedKey)
                && protector.TryUnprotect(protectedKey, out var plain)
                && !string.IsNullOrWhiteSpace(plain))
            {
                keys[provider] = plain.Trim();
            }
        }
        return keys;
    }
}
