namespace backend.jobhunter.Application.Common.Interfaces;

public record AiProviderInfo(string Name, bool Configured);

/// <summary>The AI providers the server knows about and which of them have an API key configured.</summary>
public interface IAiProviderCatalog
{
    string DefaultProvider { get; }

    IReadOnlyList<AiProviderInfo> Providers { get; }
}
