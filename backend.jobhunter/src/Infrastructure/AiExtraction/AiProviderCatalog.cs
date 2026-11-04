using backend.jobhunter.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Infrastructure.AiExtraction;

public class AiProviderCatalog(IOptions<AiExtractionOptions> options) : IAiProviderCatalog
{
    private readonly AiExtractionOptions _options = options.Value;

    public string DefaultProvider
        => AiExtractionOptions.Providers.FirstOrDefault(
               p => string.Equals(p, _options.PreferredProvider, StringComparison.OrdinalIgnoreCase))
           ?? AiExtractionOptions.Providers[0];

    public IReadOnlyList<AiProviderInfo> Providers
        => [.. AiExtractionOptions.Providers.Select(p => new AiProviderInfo(p, _options.IsConfigured(p)))];

    public string DefaultModel(string provider, bool heavyModel) => provider switch
    {
        "OpenAI" => (heavyModel ? _options.OpenAiCvModel : null) ?? _options.OpenAiModel,
        "OpenRouter" => (heavyModel ? _options.OpenRouterCvModel : null) ?? _options.OpenRouterModel,
        _ => (heavyModel ? _options.AnthropicCvModel : null) ?? _options.AnthropicModel,
    };
}
