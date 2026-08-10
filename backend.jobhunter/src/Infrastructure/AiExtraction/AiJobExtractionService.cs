using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using backend.jobhunter.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Infrastructure.AiExtraction;

// Calls whichever AI provider is configured (preferring AiExtractionOptions.PreferredProvider,
// falling back to whichever provider actually has a key set) to turn raw page content into
// structured job fields. Keys live only in server config — never sent to or stored by the client.
public class AiJobExtractionService(IHttpClientFactory httpClientFactory, IOptions<AiExtractionOptions> options)
    : IJobExtractionAiService
{
    private static readonly JsonSerializerOptions DeserializeOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly AiExtractionOptions _options = options.Value;

    public Task<ExtractedJobDto> ExtractAsync(JobPageContent page, CancellationToken cancellationToken)
    {
        var provider = PickProvider();
        return provider switch
        {
            "OpenAI" => ExtractWithOpenAiAsync(page, cancellationToken),
            "Anthropic" => ExtractWithClaudeAsync(page, cancellationToken),
            _ => throw new InvalidOperationException(
                "No AI provider is configured for job extraction. Set an Anthropic or OpenAI API key."),
        };
    }

    private string? PickProvider()
    {
        var preferred = _options.PreferredProvider;
        var providers = string.Equals(preferred, "OpenAI", StringComparison.OrdinalIgnoreCase)
            ? new[] { ("OpenAI", _options.OpenAiApiKey), ("Anthropic", _options.AnthropicApiKey) }
            : new[] { ("Anthropic", _options.AnthropicApiKey), ("OpenAI", _options.OpenAiApiKey) };

        foreach (var (name, key) in providers)
        {
            if (!string.IsNullOrWhiteSpace(key)) return name;
        }
        return null;
    }

    private async Task<ExtractedJobDto> ExtractWithClaudeAsync(JobPageContent page, CancellationToken cancellationToken)
    {
        var schema = JsonNode.Parse(JobExtractionPrompt.JobSchemaJson);
        var body = new JsonObject
        {
            ["model"] = _options.AnthropicModel,
            ["max_tokens"] = 4096,
            ["thinking"] = new JsonObject { ["type"] = "adaptive" },
            ["output_config"] = new JsonObject
            {
                ["format"] = new JsonObject { ["type"] = "json_schema", ["schema"] = schema },
            },
            ["messages"] = new JsonArray
            {
                new JsonObject { ["role"] = "user", ["content"] = JobExtractionPrompt.BuildPrompt(page) },
            },
        };

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
        if (message?["stop_reason"]?.GetValue<string>() == "refusal")
        {
            throw new InvalidOperationException("The AI declined to process this page.");
        }

        var text = message?["content"]?.AsArray()
            .FirstOrDefault(b => b?["type"]?.GetValue<string>() == "text")?["text"]?.GetValue<string>();
        if (string.IsNullOrEmpty(text))
        {
            throw new InvalidOperationException("Empty AI response.");
        }

        return JsonSerializer.Deserialize<ExtractedJobDto>(text, DeserializeOptions)
            ?? throw new InvalidOperationException("Could not parse AI response.");
    }

    private async Task<ExtractedJobDto> ExtractWithOpenAiAsync(JobPageContent page, CancellationToken cancellationToken)
    {
        var schema = JsonNode.Parse(JobExtractionPrompt.JobSchemaJson);
        var body = new JsonObject
        {
            ["model"] = _options.OpenAiModel,
            ["response_format"] = new JsonObject
            {
                ["type"] = "json_schema",
                ["json_schema"] = new JsonObject { ["name"] = "job_posting", ["strict"] = true, ["schema"] = schema },
            },
            ["messages"] = new JsonArray
            {
                new JsonObject { ["role"] = "user", ["content"] = JobExtractionPrompt.BuildPrompt(page) },
            },
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

        var message = JsonNode.Parse(responseBody);
        var choice = message?["choices"]?.AsArray().FirstOrDefault()?["message"];
        if (choice?["refusal"] is JsonNode refusal && !string.IsNullOrEmpty(refusal.GetValue<string>()))
        {
            throw new InvalidOperationException("The AI declined to process this page.");
        }

        var text = choice?["content"]?.GetValue<string>();
        if (string.IsNullOrEmpty(text))
        {
            throw new InvalidOperationException("Empty AI response.");
        }

        return JsonSerializer.Deserialize<ExtractedJobDto>(text, DeserializeOptions)
            ?? throw new InvalidOperationException("Could not parse AI response.");
    }

    private static string Truncate(string value, int maxLength)
        => value.Length <= maxLength ? value : value[..maxLength];
}
