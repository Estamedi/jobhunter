using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Infrastructure.AiExtraction;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Infrastructure.AiCvGeneration;

// Generates a structured CV with whichever AI provider is configured. Shares the provider keys
// with job extraction (AiExtractionOptions); keys live only in server config.
public class AiCvGenerationService(IHttpClientFactory httpClientFactory, IOptions<AiExtractionOptions> options)
    : ICvGenerationAiService
{
    private static readonly JsonSerializerOptions DeserializeOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly AiExtractionOptions _options = options.Value;

    public Task<GeneratedCvDto> GenerateAsync(CvGenerationRequest request, CancellationToken cancellationToken)
    {
        return PickProvider() switch
        {
            "OpenAI" => GenerateWithOpenAiAsync(request, cancellationToken),
            "Anthropic" => GenerateWithClaudeAsync(request, cancellationToken),
            _ => throw new InvalidOperationException(
                "No AI provider is configured for CV generation. Set an Anthropic or OpenAI API key."),
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

    private async Task<GeneratedCvDto> GenerateWithClaudeAsync(CvGenerationRequest request, CancellationToken cancellationToken)
    {
        var body = new JsonObject
        {
            ["model"] = _options.AnthropicCvModel ?? _options.AnthropicModel,
            ["max_tokens"] = 8192,
            ["output_config"] = new JsonObject
            {
                ["format"] = new JsonObject
                {
                    ["type"] = "json_schema",
                    ["schema"] = JsonNode.Parse(CvGenerationPrompt.CvSchemaJson),
                },
            },
            ["messages"] = new JsonArray
            {
                new JsonObject { ["role"] = "user", ["content"] = CvGenerationPrompt.BuildPrompt(request) },
            },
        };

        using var client = httpClientFactory.CreateClient();
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages")
        {
            Content = JsonContent.Create(body),
        };
        httpRequest.Headers.Add("x-api-key", _options.AnthropicApiKey);
        httpRequest.Headers.Add("anthropic-version", "2023-06-01");

        using var response = await client.SendAsync(httpRequest, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Claude API {(int)response.StatusCode}\n{Truncate(responseBody, 300)}");
        }

        var message = JsonNode.Parse(responseBody);
        var stopReason = message?["stop_reason"]?.GetValue<string>();
        if (stopReason == "refusal")
        {
            throw new InvalidOperationException("The AI declined to generate this CV.");
        }
        if (stopReason == "max_tokens")
        {
            throw new InvalidOperationException("The generated CV was too long and got cut off.");
        }

        var text = message?["content"]?.AsArray()
            .FirstOrDefault(b => b?["type"]?.GetValue<string>() == "text")?["text"]?.GetValue<string>();
        return ParseCv(text);
    }

    private async Task<GeneratedCvDto> GenerateWithOpenAiAsync(CvGenerationRequest request, CancellationToken cancellationToken)
    {
        var body = new JsonObject
        {
            ["model"] = _options.OpenAiCvModel ?? _options.OpenAiModel,
            ["response_format"] = new JsonObject
            {
                ["type"] = "json_schema",
                ["json_schema"] = new JsonObject
                {
                    ["name"] = "cv",
                    ["strict"] = true,
                    ["schema"] = JsonNode.Parse(CvGenerationPrompt.CvSchemaJson),
                },
            },
            ["messages"] = new JsonArray
            {
                new JsonObject { ["role"] = "user", ["content"] = CvGenerationPrompt.BuildPrompt(request) },
            },
        };

        using var client = httpClientFactory.CreateClient();
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions")
        {
            Content = JsonContent.Create(body),
        };
        httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _options.OpenAiApiKey);

        using var response = await client.SendAsync(httpRequest, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"OpenAI API {(int)response.StatusCode}\n{Truncate(responseBody, 300)}");
        }

        var choice = JsonNode.Parse(responseBody)?["choices"]?.AsArray().FirstOrDefault();
        if (choice?["message"]?["refusal"] is JsonNode refusal && !string.IsNullOrEmpty(refusal.GetValue<string>()))
        {
            throw new InvalidOperationException("The AI declined to generate this CV.");
        }
        if (choice?["finish_reason"]?.GetValue<string>() == "length")
        {
            throw new InvalidOperationException("The generated CV was too long and got cut off.");
        }

        return ParseCv(choice?["message"]?["content"]?.GetValue<string>());
    }

    private static GeneratedCvDto ParseCv(string? text)
    {
        if (string.IsNullOrEmpty(text))
        {
            throw new InvalidOperationException("Empty AI response.");
        }

        return JsonSerializer.Deserialize<GeneratedCvDto>(text, DeserializeOptions)
            ?? throw new InvalidOperationException("Could not parse AI response.");
    }

    private static string Truncate(string value, int maxLength)
        => value.Length <= maxLength ? value : value[..maxLength];
}
