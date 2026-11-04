using System.Text.Json;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Infrastructure.AiExtraction;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Infrastructure.AiCommon;

// Reads the model list from the provider itself, so the settings page offers what the provider has today
// instead of a list that goes stale. OpenRouter publishes its list without a key; the others need one.
public class AiModelCatalog(
    IHttpClientFactory httpClientFactory, IOptions<AiExtractionOptions> options, IApplicationDbContext db,
    IAiKeyProtector keyProtector, IMemoryCache cache, ILogger<AiModelCatalog> logger) : IAiModelCatalog
{
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(10);
    private static readonly TimeSpan CacheFor = TimeSpan.FromMinutes(10);
    private static readonly string[] NotForChat =
        ["audio", "realtime", "transcribe", "tts", "image", "search", "embedding", "moderation", "whisper", "dall-e", "babbage", "davinci", "instruct", "computer-use"];

    public async Task<AiModelList> ListAsync(string provider, CancellationToken cancellationToken)
    {
        var saved = await db.AppSettings.AsNoTracking()
            .Where(s => AiProviderKeys.SavedSettingKeys.Contains(s.Key))
            .ToDictionaryAsync(s => s.Key, s => s.Value, cancellationToken);
        var key = AiProviderKeys.Effective(options.Value, saved, keyProtector).GetValueOrDefault(provider);

        if (provider != "OpenRouter" && key is null)
        {
            return new AiModelList(Seed(provider), "No API key for this provider, so these are suggested models. You can type any other name.");
        }

        // A new key must not be answered from the list fetched with an old one, so the key is part of the cache key.
        var cacheKey = $"ai-models:{provider}:{(key is null ? "" : Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(key)))[..16])}";
        if (cache.TryGetValue(cacheKey, out AiModelList? cached) && cached is not null) return cached;

        AiModelList result;
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(Timeout);
            result = new AiModelList(await FetchAsync(provider, key, timeout.Token), null);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException or InvalidOperationException
                                   && !cancellationToken.IsCancellationRequested)
        {
            // Only the kind of failure is logged: never the answer, which could echo the key.
            logger.LogWarning("Could not list the {Provider} models: {Failure}", provider, ex.GetType().Name);
            return new AiModelList(Seed(provider), $"{provider} did not return its models, so these are suggested ones. You can type any other name.");
        }

        cache.Set(cacheKey, result, CacheFor);
        return result;
    }

    // What is offered when the provider's own list cannot be read: the models the server is set to use, then a few
    // well-known ones. They are suggestions only; any model name can still be typed.
    private static readonly Dictionary<string, string[]> Known = new()
    {
        ["OpenAI"] = ["gpt-5.5", "gpt-4o", "gpt-4o-mini", "o3", "o4-mini"],
        ["Anthropic"] = ["claude-fable-5-1", "claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-4-8"],
        ["OpenRouter"] = ["openai/gpt-4o", "openai/gpt-4o-mini", "anthropic/claude-sonnet-4.5", "google/gemini-2.5-pro"],
    };

    private IReadOnlyList<string> Seed(string provider)
    {
        var o = options.Value;
        string?[] configured = provider switch
        {
            "OpenAI" => [o.OpenAiModel, o.OpenAiCvModel],
            "Anthropic" => [o.AnthropicModel, o.AnthropicCvModel],
            _ => [o.OpenRouterModel, o.OpenRouterCvModel],
        };
        return configured.Concat(Known.GetValueOrDefault(provider) ?? [])
            .Where(m => !string.IsNullOrWhiteSpace(m))
            .Select(m => m!.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToList();
    }

    private async Task<List<string>> FetchAsync(string provider, string? key, CancellationToken cancellationToken)
    {
        var (url, authorize) = provider switch
        {
            "OpenAI" => ("https://api.openai.com/v1/models", (Action<HttpRequestMessage>)(r => r.Headers.Authorization = new("Bearer", key))),
            "Anthropic" => ("https://api.anthropic.com/v1/models?limit=1000", r =>
            {
                r.Headers.Add("x-api-key", key);
                r.Headers.Add("anthropic-version", "2023-06-01");
            }),
            _ => ("https://openrouter.ai/api/v1/models", r => { }),
        };

        using var client = httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        authorize(request);
        using var response = await client.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
        var ids = doc.RootElement.GetProperty("data").EnumerateArray()
            .Select(m => m.TryGetProperty("id", out var id) ? id.GetString() : null)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id!)
            .Distinct(StringComparer.Ordinal);

        if (provider == "OpenAI") ids = ids.Where(IsOpenAiChatModel);
        return ids.Order(StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static bool IsOpenAiChatModel(string id)
        => (id.StartsWith("gpt-", StringComparison.Ordinal) || id.StartsWith("chatgpt", StringComparison.Ordinal)
               || (id.Length > 1 && id[0] == 'o' && char.IsDigit(id[1])))
           && !NotForChat.Any(w => id.Contains(w, StringComparison.OrdinalIgnoreCase));
}
