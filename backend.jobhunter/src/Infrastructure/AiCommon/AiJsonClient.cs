using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using backend.jobhunter.Infrastructure.AiExtraction;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Infrastructure.AiCommon;

// Sends one prompt to whichever AI provider is configured (preferring
// AiExtractionOptions.PreferredProvider, falling back to whichever has a key) and returns the
// response parsed from the provider's JSON-schema structured output. Keys live only in server config.
public class AiJsonClient(IHttpClientFactory httpClientFactory, IOptions<AiExtractionOptions> options)
{
    private static readonly JsonSerializerOptions DeserializeOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new LenientDateOnlyConverter() },
    };

    private readonly AiExtractionOptions _options = options.Value;

    public AiExtractionOptions Options => _options;

    public Task<T> CompleteAsync<T>(
        string prompt, string schemaJson, string schemaName, int maxTokens,
        string? anthropicModel, string? openAiModel, CancellationToken cancellationToken)
        => CompleteAsync<T>(null, prompt, schemaJson, schemaName, maxTokens, anthropicModel, openAiModel, cancellationToken);

    // systemPrompt carries the fixed rules; prompt carries the untrusted, user-supplied content.
    public Task<T> CompleteAsync<T>(
        string? systemPrompt, string prompt, string schemaJson, string schemaName, int maxTokens,
        string? anthropicModel, string? openAiModel, CancellationToken cancellationToken)
    {
        return PickProvider() switch
        {
            "OpenAI" => WithOpenAiAsync<T>(systemPrompt, prompt, schemaJson, schemaName, openAiModel ?? _options.OpenAiModel, cancellationToken),
            "Anthropic" => WithClaudeAsync<T>(systemPrompt, prompt, schemaJson, maxTokens, anthropicModel ?? _options.AnthropicModel, cancellationToken),
            _ => throw new InvalidOperationException("No AI provider is configured. Set an Anthropic or OpenAI API key."),
        };
    }

    private string? PickProvider()
    {
        var providers = string.Equals(_options.PreferredProvider, "OpenAI", StringComparison.OrdinalIgnoreCase)
            ? new[] { ("OpenAI", _options.OpenAiApiKey), ("Anthropic", _options.AnthropicApiKey) }
            : new[] { ("Anthropic", _options.AnthropicApiKey), ("OpenAI", _options.OpenAiApiKey) };

        foreach (var (name, key) in providers)
        {
            if (!string.IsNullOrWhiteSpace(key)) return name;
        }
        return null;
    }

    private async Task<T> WithClaudeAsync<T>(
        string? systemPrompt, string prompt, string schemaJson, int maxTokens, string model, CancellationToken cancellationToken)
    {
        var body = new JsonObject
        {
            ["model"] = model,
            ["max_tokens"] = maxTokens,
            ["output_config"] = new JsonObject
            {
                ["format"] = new JsonObject { ["type"] = "json_schema", ["schema"] = JsonNode.Parse(schemaJson) },
            },
            ["messages"] = new JsonArray { new JsonObject { ["role"] = "user", ["content"] = prompt } },
        };
        if (!string.IsNullOrWhiteSpace(systemPrompt)) body["system"] = systemPrompt;

        using var client = httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages")
        {
            Content = JsonContent.Create(body),
        };
        request.Headers.Add("x-api-key", _options.AnthropicApiKey);
        request.Headers.Add("anthropic-version", "2023-06-01");

        using var response = await client.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Claude API {(int)response.StatusCode}\n{Truncate(responseBody, 300)}");
        }

        var message = JsonNode.Parse(responseBody);
        var stopReason = message?["stop_reason"]?.GetValue<string>();
        if (stopReason == "refusal") throw new InvalidOperationException("The AI declined to process this request.");
        if (stopReason == "max_tokens") throw new InvalidOperationException("The AI response was too long and got cut off.");

        var text = message?["content"]?.AsArray()
            .FirstOrDefault(b => b?["type"]?.GetValue<string>() == "text")?["text"]?.GetValue<string>();
        return Parse<T>(text);
    }

    private async Task<T> WithOpenAiAsync<T>(
        string? systemPrompt, string prompt, string schemaJson, string schemaName, string model, CancellationToken cancellationToken)
    {
        var messages = new JsonArray();
        if (!string.IsNullOrWhiteSpace(systemPrompt))
        {
            messages.Add(new JsonObject { ["role"] = "system", ["content"] = systemPrompt });
        }
        messages.Add(new JsonObject { ["role"] = "user", ["content"] = prompt });

        var body = new JsonObject
        {
            ["model"] = model,
            ["response_format"] = new JsonObject
            {
                ["type"] = "json_schema",
                ["json_schema"] = new JsonObject
                {
                    ["name"] = schemaName,
                    ["strict"] = true,
                    ["schema"] = JsonNode.Parse(schemaJson),
                },
            },
            ["messages"] = messages,
        };

        using var client = httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions")
        {
            Content = JsonContent.Create(body),
        };
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _options.OpenAiApiKey);

        using var response = await client.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"OpenAI API {(int)response.StatusCode}\n{Truncate(responseBody, 300)}");
        }

        var choice = JsonNode.Parse(responseBody)?["choices"]?.AsArray().FirstOrDefault();
        if (choice?["message"]?["refusal"] is JsonNode refusal && !string.IsNullOrEmpty(refusal.GetValue<string>()))
        {
            throw new InvalidOperationException("The AI declined to process this request.");
        }
        if (choice?["finish_reason"]?.GetValue<string>() == "length")
        {
            throw new InvalidOperationException("The AI response was too long and got cut off.");
        }

        return Parse<T>(choice?["message"]?["content"]?.GetValue<string>());
    }

    private static T Parse<T>(string? text)
    {
        if (string.IsNullOrEmpty(text)) throw new InvalidOperationException("Empty AI response.");

        return JsonSerializer.Deserialize<T>(text, DeserializeOptions)
            ?? throw new InvalidOperationException("Could not parse AI response.");
    }

    private static string Truncate(string value, int maxLength)
        => value.Length <= maxLength ? value : value[..maxLength];
}
