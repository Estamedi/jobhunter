namespace backend.jobhunter.Application.Common.Interfaces;

public record AiProviderInfo(string Name, bool Configured);

/// <summary>The AI providers the server knows about and which of them have an API key configured.</summary>
public interface IAiProviderCatalog
{
    string DefaultProvider { get; }

    IReadOnlyList<AiProviderInfo> Providers { get; }

    /// <summary>The model a provider uses for an action when the administrator has not chosen one.</summary>
    string DefaultModel(string provider, bool heavyModel);
}
