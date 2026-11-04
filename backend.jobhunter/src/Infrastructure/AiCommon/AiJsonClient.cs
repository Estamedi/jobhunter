using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Diagnostics;
using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Constants;
using backend.jobhunter.Infrastructure.AiExtraction;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Infrastructure.AiCommon;

// Sends one prompt to the AI provider the administrator picked (OpenRouter, Anthropic or OpenAI; see
// AiSettingKeys.Provider), falling back to config and then to whichever provider has a key, and returns the
// response parsed from the provider's JSON-schema structured output. A key comes from the administrator's saved
// (encrypted) key or, without one, from server config.
public class AiJsonClient(
    IHttpClientFactory httpClientFactory, IOptions<AiExtractionOptions> options, ILogger<AiJsonClient> logger,
    LangfuseTelemetry telemetry, IUser? user = null, IApplicationDbContext? db = null, IAiKeyProtector? keyProtector = null)
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
    // Tries the preferred provider first. If it is down, over quota or refuses the key, the next provider
    // that has a key is tried. A refusal or a cut-off answer is not retried elsewhere: it would repeat.
    public async Task<T> CompleteAsync<T>(
        string? systemPrompt, string prompt, string schemaJson, string schemaName, int maxTokens,
        string? anthropicModel, string? openAiModel, CancellationToken cancellationToken)
    {
        var (providers, modelOverride, apiKeys) = await PickProvidersAsync(schemaName, cancellationToken);
        if (providers.Count == 0)
        {
            throw new AiServiceException(AiFailure.NotConfigured, "AI is not set up on the server. Ask the administrator to add an API key.");
        }

        for (var i = 0; i < providers.Count; i++)
        {
            var provider = providers[i];
            try
            {
                return await CompleteWithAsync<T>(
                    provider, apiKeys[provider], systemPrompt, prompt, schemaJson, schemaName, maxTokens, anthropicModel, openAiModel,
                    i == 0 ? modelOverride : null, cancellationToken);
            }
            catch (AiServiceException ex) when (i < providers.Count - 1 && CanFallBack(ex.Failure))
            {
                logger.LogWarning("{Provider} failed ({Failure}); trying {Next} instead.", provider, ex.Failure, providers[i + 1]);
            }
        }

        throw new UnreachableException();
    }

    private static bool CanFallBack(AiFailure failure)
        => failure is AiFailure.Unavailable or AiFailure.RateLimited or AiFailure.NotConfigured;

    private async Task<T> CompleteWithAsync<T>(
        string provider, string apiKey, string? systemPrompt, string prompt, string schemaJson, string schemaName, int maxTokens,
        string? anthropicModel, string? openAiModel, string? modelOverride, CancellationToken cancellationToken)
    {
        var call = new AiCallInfo();
        var timer = Stopwatch.StartNew();
        var outcome = "ok";
        using var activity = telemetry.StartGeneration(
            LangfuseTelemetry.OperationName(schemaName), provider,
            provider switch
            {
                "OpenAI" => modelOverride ?? openAiModel ?? _options.OpenAiModel,
                "OpenRouter" => modelOverride ?? OpenRouterModel(openAiModel),
                _ => modelOverride ?? anthropicModel ?? _options.AnthropicModel,
            },
            maxTokens, user?.Id);
        try
        {
            return provider switch
            {
                "OpenAI" => await WithOpenAiCompatibleAsync<T>(systemPrompt, prompt, schemaJson, schemaName, modelOverride ?? openAiModel ?? _options.OpenAiModel, call,
                    "https://api.openai.com/v1/chat/completions", apiKey, "OpenAI", cancellationToken),
                "OpenRouter" => await WithOpenAiCompatibleAsync<T>(systemPrompt, prompt, schemaJson, schemaName, modelOverride ?? OpenRouterModel(openAiModel), call,
                    "https://openrouter.ai/api/v1/chat/completions", apiKey, "OpenRouter", cancellationToken),
                "Anthropic" => await WithClaudeAsync<T>(systemPrompt, prompt, schemaJson, maxTokens, modelOverride ?? anthropicModel ?? _options.AnthropicModel, apiKey, call, cancellationToken),
                _ => throw new AiServiceException(AiFailure.NotConfigured, "AI is not set up on the server. Ask the administrator to add an API key."),
            };
        }
        catch (Exception ex)
        {
            outcome = ex is AiServiceException ai ? ai.Failure.ToString() : ex.GetType().Name;
            if (activity is not null) LangfuseTelemetry.Fail(activity, ex);
            throw;
        }
        finally
        {
            timer.Stop();
            // One line per call for cost and speed. Only numbers and names: never the prompt or the answer.
            logger.LogInformation(
                "AI call {Operation} on {Provider} {Model}: {InputTokens} tokens in, {OutputTokens} out, {ElapsedMs} ms, {Outcome}",
                schemaName, provider, call.Model, call.InputTokens, call.OutputTokens, timer.ElapsedMilliseconds, outcome);
            if (activity is not null)
            {
                telemetry.Complete(activity, systemPrompt, prompt, call.Output, call.InputTokens, call.OutputTokens);
            }
        }
    }

    // A caller passing an OpenAI model name means "use the heavier CV model"; mirror that tier on OpenRouter.
    private string OpenRouterModel(string? openAiModel)
        => openAiModel is null ? _options.OpenRouterModel : _options.OpenRouterCvModel ?? _options.OpenRouterModel;

    // The administrator's choices (saved in AppSettings) win over config. For an action with its own provider
    // that provider goes first (with its model, if one was set); otherwise the global provider does. The rest
    // follow, only those that have a key, so the app keeps working when one of them is down. A key the
    // administrator saved wins over the one in server config; a saved key that cannot be read is skipped.
    private async Task<(List<string> Providers, string? ModelOverride, Dictionary<string, string> ApiKeys)> PickProvidersAsync(
        string action, CancellationToken cancellationToken)
    {
        var preferred = _options.PreferredProvider;
        string? actionProvider = null, actionModel = null;
        var apiKeys = AiProviderKeys.Effective(_options, new Dictionary<string, string>(), null);

        if (db is not null)
        {
            var keys = new[] { AiSettingKeys.Provider, AiSettingKeys.ActionProvider(action), AiSettingKeys.ActionModel(action) }
                .Concat(AiProviderKeys.SavedSettingKeys)
                .ToArray();
            var saved = await db.AppSettings.AsNoTracking()
                .Where(s => keys.Contains(s.Key))
                .ToDictionaryAsync(s => s.Key, s => s.Value, cancellationToken);
            if (saved.TryGetValue(keys[0], out var global) && !string.IsNullOrWhiteSpace(global)) preferred = global;
            if (saved.TryGetValue(keys[1], out var p) && !string.IsNullOrWhiteSpace(p)) actionProvider = p;
            if (saved.TryGetValue(keys[2], out var m) && !string.IsNullOrWhiteSpace(m)) actionModel = m;

            apiKeys = AiProviderKeys.Effective(_options, saved, keyProtector);
        }

        var first = actionProvider ?? preferred;
        var providers = AiExtractionOptions.Providers
            .OrderBy(p => string.Equals(p, first, StringComparison.OrdinalIgnoreCase) ? 0 : 1)
            .Where(apiKeys.ContainsKey)
            .ToList();

        // A model name only means something to the provider it was chosen for.
        var modelFor = providers.Count > 0 && actionModel is not null
            && string.Equals(providers[0], actionProvider ?? preferred, StringComparison.OrdinalIgnoreCase)
            ? actionModel : null;
        return (providers, modelFor, apiKeys);
    }

    private async Task<T> WithClaudeAsync<T>(
        string? systemPrompt, string prompt, string schemaJson, int maxTokens, string model, string apiKey, AiCallInfo call, CancellationToken cancellationToken)
    {
        call.Model = model;
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
        request.Headers.Add("x-api-key", apiKey);
        request.Headers.Add("anthropic-version", "2023-06-01");

        var responseBody = await SendAsync(client, request, "Claude", cancellationToken);

        var message = JsonNode.Parse(responseBody);
        call.InputTokens = message?["usage"]?["input_tokens"]?.GetValue<int>();
        call.OutputTokens = message?["usage"]?["output_tokens"]?.GetValue<int>();
        var stopReason = message?["stop_reason"]?.GetValue<string>();
        if (stopReason == "refusal") throw new AiServiceException(AiFailure.Rejected, RefusedMessage);
        if (stopReason == "max_tokens") throw new AiServiceException(AiFailure.Rejected, TooLongMessage);

        var text = message?["content"]?.AsArray()
            .FirstOrDefault(b => b?["type"]?.GetValue<string>() == "text")?["text"]?.GetValue<string>();
        call.Output = text;
        return Parse<T>(text);
    }

    private async Task<T> WithOpenAiCompatibleAsync<T>(
        string? systemPrompt, string prompt, string schemaJson, string schemaName, string model, AiCallInfo call,
        string endpoint, string? apiKey, string providerName, CancellationToken cancellationToken)
    {
        call.Model = model;
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
        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = JsonContent.Create(body),
        };
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        var responseBody = await SendAsync(client, request, providerName, cancellationToken);

        var completion = JsonNode.Parse(responseBody);
        call.InputTokens = completion?["usage"]?["prompt_tokens"]?.GetValue<int>();
        call.OutputTokens = completion?["usage"]?["completion_tokens"]?.GetValue<int>();
        var choice = completion?["choices"]?.AsArray().FirstOrDefault();
        if (choice?["message"]?["refusal"] is JsonNode refusal && !string.IsNullOrEmpty(refusal.GetValue<string>()))
        {
            throw new AiServiceException(AiFailure.Rejected, RefusedMessage);
        }
        if (choice?["finish_reason"]?.GetValue<string>() == "length")
        {
            throw new AiServiceException(AiFailure.Rejected, TooLongMessage);
        }

        call.Output = choice?["message"]?["content"]?.GetValue<string>();
        return Parse<T>(call.Output);
    }

    private const string RefusedMessage = "The AI declined to process this request.";
    private const string TooLongMessage = "The answer was too long for the AI to finish. Try shortening your background or the job description.";
    private const string UnreadableMessage = "The AI returned an answer that could not be read. Please try again.";

    // Sends the request and returns the body. Failures become AiServiceException with a message that is
    // safe to show; the provider's own response is only logged (it can be long and echo request details).
    private async Task<string> SendAsync(
        HttpClient client, HttpRequestMessage request, string provider, CancellationToken cancellationToken)
    {
        HttpResponseMessage response;
        try
        {
            response = await client.SendAsync(request, cancellationToken);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "{Provider} request failed before a response arrived", provider);
            throw new AiServiceException(AiFailure.Unavailable, "Could not reach the AI service. Please try again.");
        }

        using (response)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            if (response.IsSuccessStatusCode) return body;

            var status = (int)response.StatusCode;
            logger.LogWarning("{Provider} API returned {Status}: {Body}", provider, status, Truncate(body, 500));
            throw status switch
            {
                401 or 403 => new AiServiceException(AiFailure.NotConfigured, "The AI service rejected the server's API key. Ask the administrator to check it."),
                429 => new AiServiceException(AiFailure.RateLimited, "The AI service is busy or over its quota. Please try again in a minute."),
                _ => new AiServiceException(AiFailure.Unavailable, "The AI service had a problem. Please try again."),
            };
        }
    }

    private static T Parse<T>(string? text)
    {
        if (string.IsNullOrEmpty(text)) throw new AiServiceException(AiFailure.Unavailable, UnreadableMessage);

        return JsonSerializer.Deserialize<T>(text, DeserializeOptions)
            ?? throw new AiServiceException(AiFailure.Unavailable, UnreadableMessage);
    }

    private static string Truncate(string value, int maxLength)
        => value.Length <= maxLength ? value : value[..maxLength];
}
