namespace backend.jobhunter.Infrastructure.AiExtraction;

public class AiExtractionOptions
{
    public string PreferredProvider { get; set; } = "OpenAI";
    public string? AnthropicApiKey { get; set; }
    public string AnthropicModel { get; set; } = "claude-opus-4-8";
    public string? AnthropicCvModel { get; set; }
    public string? OpenAiApiKey { get; set; }
    public string OpenAiModel { get; set; } = "gpt-4o-mini";
    public string? OpenAiCvModel { get; set; }
    public string? OpenRouterApiKey { get; set; }
    public string OpenRouterModel { get; set; } = "openai/gpt-4o-mini";
    public string? OpenRouterCvModel { get; set; }

    /// <summary>Providers an administrator can pick between.</summary>
    public static readonly string[] Providers = ["OpenRouter", "Anthropic", "OpenAI"];

    /// <summary>The key from server config (the administrator's saved key, if any, is read separately).</summary>
    public string? ConfigKey(string provider) => provider switch
    {
        "OpenRouter" => OpenRouterApiKey,
        "Anthropic" => AnthropicApiKey,
        "OpenAI" => OpenAiApiKey,
        _ => null,
    };

    public bool IsConfigured(string provider) => !string.IsNullOrWhiteSpace(ConfigKey(provider));
}
