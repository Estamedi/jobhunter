using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Application.FunctionalTests.Infrastructure;

// Stands in for the AI provider and the live-update hub, so the background worker can run for real in a
// test without a key or a network. Tests set OnGenerate to control what the "AI" does.
public sealed class FakeCvAi : ICvGenerationAiService
{
    public static Func<CvGenerationRequest, Task<GeneratedCvDto>>? OnGenerate { get; set; }
    public static int Calls;
    public static CvGenerationRequest? LastRequest;

    public static void Reset()
    {
        OnGenerate = null;
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
        => throw new NotSupportedException();

    public Task<GeneratedCvDto> RefineSectionAsync(CvSectionRefineRequest request, CancellationToken cancellationToken)
        => throw new NotSupportedException();
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
