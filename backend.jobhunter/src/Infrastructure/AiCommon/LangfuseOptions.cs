namespace backend.jobhunter.Infrastructure.AiCommon;

// Tracing is off until both keys are set. LogContent controls whether prompts and answers (which
// contain CV and profile text) are sent to Langfuse; by default only model, tokens and timing are.
public class LangfuseOptions
{
    public string Host { get; set; } = "https://cloud.langfuse.com";
    public string? PublicKey { get; set; }
    public string? SecretKey { get; set; }
    public bool LogContent { get; set; }
    public string Environment { get; set; } = "production";
    public string? Release { get; set; }

    public bool Enabled => !string.IsNullOrWhiteSpace(PublicKey) && !string.IsNullOrWhiteSpace(SecretKey);
}
