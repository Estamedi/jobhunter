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
}
