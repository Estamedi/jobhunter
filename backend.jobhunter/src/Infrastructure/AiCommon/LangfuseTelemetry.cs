using System.Diagnostics;
using System.Text;
using System.Text.Json;
using OpenTelemetry;
using OpenTelemetry.Exporter;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Infrastructure.AiCommon;

// What one provider call reports back, so the caller can trace it.
public sealed class AiCallInfo
{
    public string? Model { get; set; }
    public int? InputTokens { get; set; }
    public int? OutputTokens { get; set; }
    public string? Output { get; set; }
}

// Sends each AI call to Langfuse as an OpenTelemetry span through Langfuse's OTLP endpoint. It uses its
// own tracer provider that listens only to this ActivitySource, so ASP.NET/HTTP spans stay out of
// Langfuse and a Langfuse outage never touches the app's other telemetry or the user's request.
public sealed class LangfuseTelemetry : IDisposable
{
    private const string SourceName = "backend.jobhunter.Ai";
    private static readonly ActivitySource Source = new(SourceName);

    private readonly LangfuseOptions _options;
    private readonly TracerProvider? _provider;

    public LangfuseTelemetry(IOptions<LangfuseOptions> options)
    {
        _options = options.Value;
        if (!_options.Enabled) return;

        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_options.PublicKey}:{_options.SecretKey}"));
        _provider = Sdk.CreateTracerProviderBuilder()
            .SetResourceBuilder(ResourceBuilder.CreateDefault().AddService("jobhunter-backend"))
            .AddSource(SourceName)
            .AddOtlpExporter(o =>
            {
                o.Endpoint = new Uri($"{_options.Host.TrimEnd('/')}/api/public/otel/v1/traces");
                o.Protocol = OtlpExportProtocol.HttpProtobuf;
                o.Headers = $"Authorization=Basic {credentials},x-langfuse-ingestion-version=4";
            })
            .Build();
    }

    public bool LogContent => _options.LogContent;

    // Names are verb-first and stable (they are what evaluators and dashboards filter on); the model and
    // anything run-specific live in attributes, not in the name.
    public static string OperationName(string schemaName) => schemaName switch
    {
        "job_requirements" => "extract-job-requirements",
        "cv" => "generate-cv",
        "profile" => "import-profile",
        _ => $"generate-{schemaName}",
    };

    // Each AI call is its own trace with a generation as the root observation, so the trace input and
    // output are the prompt and answer.
    public Activity? StartGeneration(string operation, string provider, string model, int maxTokens, string? userId)
    {
        // default parent: do not hang this span under the HTTP request, whose spans are not exported here.
        var activity = Source.StartActivity(operation, ActivityKind.Client, default(ActivityContext));
        if (activity is null) return null;

        activity.SetTag("langfuse.observation.type", "generation");
        activity.SetTag("langfuse.trace.name", operation);
        activity.SetTag("langfuse.trace.tags", new[] { operation, provider });
        activity.SetTag("langfuse.environment", _options.Environment);
        if (!string.IsNullOrEmpty(_options.Release)) activity.SetTag("langfuse.release", _options.Release);
        if (!string.IsNullOrEmpty(userId)) activity.SetTag("langfuse.user.id", userId);
        activity.SetTag("langfuse.observation.model.name", model);
        activity.SetTag("langfuse.observation.model.parameters", JsonSerializer.Serialize(new { max_tokens = maxTokens }));
        activity.SetTag("langfuse.observation.metadata.provider", provider);
        return activity;
    }

    // input/output use the role-labeled message format Langfuse renders as a conversation.
    public void Complete(
        Activity activity, string? systemPrompt, string prompt, string? output, int? inputTokens, int? outputTokens)
    {
        if (LogContent)
        {
            var messages = new List<object>();
            if (!string.IsNullOrWhiteSpace(systemPrompt)) messages.Add(new { role = "system", content = systemPrompt });
            messages.Add(new { role = "user", content = prompt });
            activity.SetTag("langfuse.observation.input", JsonSerializer.Serialize(messages));
            if (output is not null)
            {
                activity.SetTag("langfuse.observation.output", JsonSerializer.Serialize(new { role = "assistant", content = output }));
            }
        }
        if (inputTokens is not null || outputTokens is not null)
        {
            activity.SetTag("langfuse.observation.usage_details", JsonSerializer.Serialize(new { input = inputTokens, output = outputTokens }));
        }
    }

    public static void Fail(Activity activity, Exception ex)
    {
        activity.SetStatus(ActivityStatusCode.Error, ex.Message);
        activity.SetTag("langfuse.observation.level", "ERROR");
        activity.SetTag("langfuse.observation.status_message", ex.Message);
    }

    public void Dispose() => _provider?.Dispose();
}
