using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Application.FunctionalTests.Infrastructure;

// Stands in for the AI provider and the live-update hub, so the background worker can run for real in a
// test without a key or a network. Tests set OnGenerate to control what the "AI" does.
public sealed class FakeCvAi : ICvGenerationAiService
{
    public static Func<CvGenerationRequest, Task<GeneratedCvDto>>? OnGenerate { get; set; }
    public static int Calls;
    public static CvGenerationRequest? LastRequest;
    public static Func<string, Task<JobRequirementsDto>>? OnExtract { get; set; }
    public static int ExtractCalls;
    public static Func<CvSectionRefineRequest, GeneratedCvDto>? OnRefine { get; set; }

    public static void Reset()
    {
        OnGenerate = null;
        OnExtract = null;
        OnRefine = null;
        Interlocked.Exchange(ref ExtractCalls, 0);
        LastRequest = null;
        Interlocked.Exchange(ref Calls, 0);
    }

    public static GeneratedCvDto SampleCv() => new()
    {
        Headline = "Engineer",
        Summary = "Lead engineer with 12 years of delivery.",
        Experience =
        [
            new CvExperienceDto
            {
                Role = "Lead", Company = "Acme", StartDate = "Jan 2022", EndDate = "Present",
                Bullets = ["Cut cloud costs by 30% across 12 services.", "Led the platform team through two cloud migrations and kept every release on schedule.", "Wrote the release checklist that the whole engineering group still follows for each deploy."],
            },
        ],
    };

    public Task<GeneratedCvDto> GenerateAsync(CvGenerationRequest request, CancellationToken cancellationToken)
    {
        Interlocked.Increment(ref Calls);
        LastRequest = request;
        return OnGenerate is null ? Task.FromResult(SampleCv()) : OnGenerate(request);
    }

    public Task<JobRequirementsDto> ExtractRequirementsAsync(string jobDescription, CancellationToken cancellationToken)
    {
        Interlocked.Increment(ref ExtractCalls);
        return OnExtract is null ? Task.FromResult(new JobRequirementsDto()) : OnExtract(jobDescription);
    }

    public Task<GeneratedCvDto> RefineSectionAsync(CvSectionRefineRequest request, CancellationToken cancellationToken)
        => OnRefine is null ? throw new NotSupportedException() : Task.FromResult(OnRefine(request));
}

// Records what the worker announces and still passes it on to the real SignalR notifier, so the live hub
// can be tested end to end.
public sealed class CapturingNotifier(Microsoft.AspNetCore.SignalR.IHubContext<backend.jobhunter.Web.Services.CvGenerationHub> hub)
    : ICvGenerationNotifier
{
    public static readonly List<(string OwnerId, int DraftId, string Status)> Sent = [];

    private readonly ICvGenerationNotifier _real = new backend.jobhunter.Web.Services.SignalRCvGenerationNotifier(hub);

    public Task NotifyAsync(string ownerId, int draftId, string status, CancellationToken cancellationToken)
    {
        lock (Sent) Sent.Add((ownerId, draftId, status));
        return _real.NotifyAsync(ownerId, draftId, status, cancellationToken);
    }
}

// Stands in for the AI that reads an uploaded CV into a profile. Tests set OnParse to control it.
public sealed class FakeProfileImportAi : IProfileImportAiService
{
    public static Func<string, Task<ParsedProfileDto>>? OnParse { get; set; }
    public static int Calls;
    public static string? LastText;

    public static void Reset()
    {
        OnParse = null;
        LastText = null;
        Interlocked.Exchange(ref Calls, 0);
    }

    public static ParsedProfileDto SampleProfile() => new()
    {
        Headline = "Senior engineer",
        Summary = "Engineer with 12 years of experience.",
        Experiences = [new ParsedExperienceDto { Title = "Lead", Company = "Acme", StartDate = new DateOnly(2022, 1, 1), IsCurrent = true }],
    };

    public Task<ParsedProfileDto> ParseAsync(string cvText, CancellationToken cancellationToken)
    {
        Interlocked.Increment(ref Calls);
        LastText = cvText;
        return OnParse is null ? Task.FromResult(SampleProfile()) : OnParse(cvText);
    }
}

// Stands in for the network: records what would have been sent to an AI provider and answers with a fixed
// reply, so a test can check which key a call carried.
public sealed class FakeAiHttp : IHttpClientFactory
{
    public static readonly List<(string Host, string? Authorization, string? ApiKeyHeader)> Requests = [];

    // A test can answer a request itself (return null to use the default chat reply).
    public static Func<HttpRequestMessage, HttpResponseMessage?>? Override { get; set; }

    public static void Reset()
    {
        lock (Requests) Requests.Clear();
        Override = null;
    }

    public HttpClient CreateClient(string name) => new(new Handler());

    private sealed class Handler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            lock (Requests)
            {
                Requests.Add((
                    request.RequestUri!.Host,
                    request.Headers.Authorization?.ToString(),
                    request.Headers.TryGetValues("x-api-key", out var values) ? values.Single() : null));
            }
            var custom = Override?.Invoke(request);
            if (custom is not null) return Task.FromResult(custom);
            var reply = request.RequestUri!.Host == "api.anthropic.com"
                ? """{"stop_reason":"end_turn","content":[{"type":"text","text":"{\"text\":\"ok\"}"}],"usage":{"input_tokens":1,"output_tokens":1}}"""
                : """{"choices":[{"finish_reason":"stop","message":{"content":"{\"text\":\"ok\"}"}}],"usage":{"prompt_tokens":1,"completion_tokens":1}}""";
            return Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK) { Content = new StringContent(reply) });
        }
    }
}
