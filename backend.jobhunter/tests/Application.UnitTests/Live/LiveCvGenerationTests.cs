using System.Text.Json;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;
using backend.jobhunter.Infrastructure.AiCommon;
using backend.jobhunter.Infrastructure.AiCvGeneration;
using backend.jobhunter.Infrastructure.AiExtraction;
using backend.jobhunter.Infrastructure.AiProfileImport;
using backend.jobhunter.Infrastructure.CvImport;
using backend.jobhunter.Infrastructure.CvRendering;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;

namespace backend.jobhunter.Application.UnitTests.Live;

// The whole CV process on a real file with the real AI, step by step:
//   PDF file -> text -> AI profile import -> profile rows -> background -> AI generation
//   -> merge + grounding check (+ one retry) -> score -> PDF.
// Never runs by default (Explicit): it costs money and needs a key.
//   CV_LIVE_OPENAI_KEY=... CV_LIVE_PROFILE_PDF=/path/Profile.pdf CV_LIVE_OUT_DIR=/some/dir \
//     dotnet test tests/Application.UnitTests --filter "FullyQualifiedName~LiveCvGeneration"
[Explicit("Calls the real AI provider")]
public class LiveCvGenerationTests
{
    private static readonly JsonSerializerOptions Pretty = new(JsonSerializerDefaults.Web) { WriteIndented = true };

    private static readonly (string Name, string Title, string Description)[] Jobs =
    [
        ("devops", "DevOps Engineer",
            "We are hiring a DevOps Engineer to own our cloud infrastructure and delivery pipelines. You will build CI/CD pipelines, manage infrastructure as code with Terraform, automate configuration with Ansible, run containers on Docker and Kubernetes, and set up monitoring and logging with Prometheus and Grafana. Experience with AWS or Azure, Linux, and incident response is required. Kubernetes experience and scripting in Bash or Python are a plus."),
        ("ai-engineer", "AI Engineer",
            "We are looking for an AI Engineer to build LLM-powered features. You will integrate OpenAI and other model APIs, build chatbots and document-processing workflows, design retrieval-augmented generation (RAG) pipelines, evaluate model output quality, and ship these features as reliable production services. Strong backend engineering, API design and cloud deployment skills are required. Python and vector databases are a plus."),
    ];

    public static IEnumerable<TestCaseData> JobCases()
        => Jobs.Select(j => new TestCaseData(j.Name, j.Title, j.Description).SetName($"LiveCvGeneration_{j.Name}"));

    private static void Step(string text) => TestContext.Progress.WriteLine($"[live-cv] {text}");

    internal const string Model = "gpt-5.5";

    internal static (AiCvGenerationService Cv, AiProfileImportService Import) Services(string key)
    {
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(() => new HttpClient { Timeout = TimeSpan.FromMinutes(5) });
        var options = new AiExtractionOptions { PreferredProvider = "OpenAI", OpenAiApiKey = key, OpenAiCvModel = Model };
        var client = new AiJsonClient(
            factory.Object, Options.Create(options), NullLogger<AiJsonClient>.Instance,
            new LangfuseTelemetry(Options.Create(new LangfuseOptions())));
        return (new AiCvGenerationService(client), new AiProfileImportService(client));
    }

    // Same mapping as the ImportProfile command; ids stand in for the database ids.
    private static CandidateProfile ToProfile(ParsedProfileDto p)
    {
        var profile = new CandidateProfile { Headline = p.Headline, Summary = p.Summary };
        var id = 1;
        foreach (var e in p.Experiences.Where(e => e.StartDate.HasValue))
        {
            profile.Experiences.Add(new ProfileExperience
            {
                Id = id++, Title = e.Title.Trim(), Company = e.Company.Trim(), IsCurrent = e.IsCurrent,
                StartDate = e.StartDate!.Value, EndDate = e.IsCurrent ? null : e.EndDate, Location = e.Location?.Trim(),
                Description = e.Description?.Trim(), Skills = e.Skills.Select(k => k.Trim()).Where(k => k.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
            });
        }
        id = 1;
        foreach (var e in p.Educations)
        {
            profile.Educations.Add(new ProfileEducation
            {
                Id = id++, Institution = e.Institution.Trim(), Degree = e.Degree.Trim(), FieldOfStudy = e.FieldOfStudy?.Trim(),
                StartDate = e.StartDate, EndDate = e.EndDate, Details = e.Details?.Trim(),
            });
        }
        id = 1;
        foreach (var s in p.Skills) profile.Skills.Add(new ProfileSkill { Id = id, Name = s.Name.Trim(), Category = s.Category, SortOrder = id++ });
        id = 1;
        foreach (var x in p.Projects) profile.Projects.Add(new ProfileProject { Id = id, Name = x.Name, Description = x.Description, Url = x.Url, StartDate = x.StartDate, EndDate = x.EndDate, SortOrder = id++ });
        id = 1;
        foreach (var x in p.Certifications) profile.Certifications.Add(new ProfileCertification { Id = id, Name = x.Name, Issuer = x.Issuer, IssuedDate = x.IssuedDate, SortOrder = id++ });
        id = 1;
        foreach (var x in p.Languages)
        {
            profile.Languages.Add(new ProfileLanguage
            {
                Id = id, Name = x.Name,
                Proficiency = Enum.TryParse<LanguageProficiency>(x.Proficiency?.Replace(" ", ""), true, out var level) ? level : LanguageProficiency.ProfessionalWorking,
                SortOrder = id++,
            });
        }
        id = 1;
        foreach (var x in p.Links) profile.Links.Add(new ProfileLink { Id = id, Label = x.Label, Url = x.Url, SortOrder = id++ });
        return profile;
    }

    [TestCaseSource(nameof(JobCases))]
    public async Task ShouldGenerateACvFromAnUploadedLinkedInPdf(string name, string title, string description)
    {
        var key = Environment.GetEnvironmentVariable("CV_LIVE_OPENAI_KEY");
        Assume.That(key, Is.Not.Null.And.Not.Empty, "Set CV_LIVE_OPENAI_KEY to run this test.");
        var pdfPath = Environment.GetEnvironmentVariable("CV_LIVE_PROFILE_PDF") ?? "/home/saber/Downloads/Profile.pdf";
        Assume.That(File.Exists(pdfPath), $"Profile PDF not found: {pdfPath}");
        var outDir = Path.Combine(Environment.GetEnvironmentVariable("CV_LIVE_OUT_DIR") ?? Path.GetTempPath(), name);
        Directory.CreateDirectory(outDir);
        var (cvAi, importAi) = Services(key!);

        // 1. File -> text, the way an uploaded CV is read.
        Step($"1/7 reading {pdfPath}");
        string text;
        await using (var stream = File.OpenRead(pdfPath))
        {
            text = await new CvTextExtractor().ExtractTextAsync(stream, Path.GetFileName(pdfPath), default);
        }
        File.WriteAllText(Path.Combine(outDir, "01-extracted-text.txt"), text);
        Step($"    extracted {text.Length} characters");

        // 2. Text -> structured profile with the AI (the profile import preview).
        Step("2/7 AI profile import (parsing the text into a profile)");
        var parsed = await importAi.ParseAsync(text, default);
        File.WriteAllText(Path.Combine(outDir, "02-parsed-profile.json"), JsonSerializer.Serialize(parsed, Pretty));
        Step($"    found {parsed.Experiences.Count} experiences, {parsed.Educations.Count} educations, {parsed.Skills.Count} skills, {parsed.Projects.Count} projects");

        // 3. Parsed result -> profile rows (what saving the import does).
        Step("3/7 building the profile rows");
        var profile = ToProfile(parsed);
        Assert.That(profile.Experiences, Is.Not.Empty, "The import found no experience in the PDF.");

        // 4. Profile -> background text (with [id:N] markers) that is sent to the AI.
        Step("4/7 building the background text");
        var background = CvBackgroundBuilder.BuildWithWarnings(profile, null);
        File.WriteAllText(Path.Combine(outDir, "03-background.txt"), background.Text ?? "");
        Step($"    background is {background.Text?.Length ?? 0} characters, {background.Warnings.Count} warning(s)");

        // 5. Generate for the target job.
        var request = CvGenerationPipeline.BuildRequest(
            "Saber Motamedi", "sabermotamed@gmail.com", "+968 9221 8568", "Muscat, Oman",
            new CvGenerationInputs(title, description), background, DateOnly.FromDateTime(DateTime.UtcNow));
        Step($"5/7 AI generation for \"{title}\" (target {request.TargetPages} page(s))");
        var first = await cvAi.GenerateAsync(request, default);
        File.WriteAllText(Path.Combine(outDir, "04-first-draft.json"), CvDraftContent.Serialize(first));

        // 6. Merge profile facts, grounding check, and one retry if a check fails.
        Step("6/7 merge, grounding check and writing checks (one retry at most)");
        var result = await CvDraftImprover.ImproveAsync(cvAi, request, first, background, default);
        var score = CvScorer.Score(result.Cv);
        var warnings = background.Warnings.Concat(result.Warnings).ToList();
        File.WriteAllText(Path.Combine(outDir, "05-final.json"), CvDraftContent.Serialize(result.Cv));
        File.WriteAllText(Path.Combine(outDir, "06-report.txt"),
            $"Score: {score.Overall}\n\nChecks below 10:\n"
            + string.Join("\n", score.Checks.Where(c => c.Score < 10).Select(c => $"- {c.Id} {c.Score}: " + string.Join(" | ", c.Issues.Select(i => i.Message))))
            + "\n\nWarnings shown to the user:\n" + string.Join("\n", warnings.Select(w => "- " + w)));
        Step($"    score {score.Overall}, {warnings.Count} warning(s), grounding issues {result.GroundingIssues}");

        // 7. Render the PDF.
        Step("7/7 rendering the PDF");
        var pdf = new QuestPdfCvRenderer().Render("classic", new CvHeaderDto("Saber Motamedi", "sabermotamed@gmail.com", "+968 9221 8568", "Muscat, Oman"), result.Cv);
        var pdfOut = Path.Combine(outDir, $"{name}-cv.pdf");
        File.WriteAllBytes(pdfOut, pdf);
        Step($"    wrote {pdfOut}");

        Assert.That(result.Cv.Experience, Is.Not.Empty);
    }
}
