namespace backend.jobhunter.Application.Common.Interfaces;

/// <summary>
/// The models a provider offers. When the provider's own list could not be read, Models holds suggested ones and
/// Problem says so in plain words; it never holds a key or a provider message.
/// </summary>
public record AiModelList(IReadOnlyList<string> Models, string? Problem);

public interface IAiModelCatalog
{
    /// <summary>Asks the provider for its models with the key the server would really use. Never throws for a provider failure.</summary>
    Task<AiModelList> ListAsync(string provider, CancellationToken cancellationToken);
}
