using System.Runtime.CompilerServices;
using System.Text.Json;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts;
using backend.jobhunter.Application.UnitTests.Live;
using backend.jobhunter.Infrastructure.CvImport;
using backend.jobhunter.Infrastructure.CvRendering;
using NUnit.Framework;

namespace backend.jobhunter.Application.UnitTests.Eval;

// Writes a CV for every fixture with the real AI, scores each one and prints one table. Never runs by
// default (Explicit): it costs money and takes a minute or two per fixture.
//   CV_LIVE_OPENAI_KEY=... CV_EVAL_OUT_DIR=/some/dir [CV_EVAL_ONLY=name1,name2] [CV_EVAL_UPDATE_BASELINE=1] \
//     dotnet test tests/Application.UnitTests --filter "FullyQualifiedName~CvEvalRunTests"
// Run it only after a very big CV-pipeline change (a new prompt, model, schema or generation flow).
[Explicit("Calls the real AI provider")]
public class CvEvalRunTests
{
    private static string EvalDir([CallerFilePath] string path = "") => Path.GetDirectoryName(path)!;

    [Test]
    public async Task ShouldScoreEveryFixture()
    {
        var key = Environment.GetEnvironmentVariable("CV_LIVE_OPENAI_KEY");
        Assume.That(key, Is.Not.Null.And.Not.Empty, "Set CV_LIVE_OPENAI_KEY to run this test.");
        var outDir = Environment.GetEnvironmentVariable("CV_EVAL_OUT_DIR") ?? Path.Combine(Path.GetTempPath(), "cv-eval");
        Directory.CreateDirectory(outDir);
        var only = Environment.GetEnvironmentVariable("CV_EVAL_ONLY")?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var fixtures = Directory.GetFiles(Path.Combine(EvalDir(), "Fixtures"), "*.json").Order()
            .Select(CvEvalFixture.Load)
            .Where(f => only is null || only.Contains(f.Name))
            .ToList();
        Assert.That(fixtures, Is.Not.Empty);

        var cvAi = LiveCvGenerationTests.Services(key!).Cv;
        var rows = new List<CvEvalRow>();
        foreach (var fixture in fixtures)
        {
            TestContext.Progress.WriteLine($"[cv-eval] {fixture.Name}");
            try
            {
                rows.Add(await RunOneAsync(fixture, cvAi, outDir));
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // One failing fixture must not hide the others.
                rows.Add(new CvEvalRow(fixture.Name, [], new CvEvalMetrics(), ex.Message.ReplaceLineEndings(" ")));
            }
        }

        var baselinePath = Path.Combine(EvalDir(), "baseline.json");
        var baseline = CvEvalReport.LoadBaseline(baselinePath);
        var markdown = CvEvalReport.Markdown(LiveCvGenerationTests.Model, rows, baseline);
        File.WriteAllText(Path.Combine(outDir, "summary.md"), markdown);
        File.WriteAllText(Path.Combine(outDir, "results.json"),
            JsonSerializer.Serialize(rows, new JsonSerializerOptions(JsonSerializerDefaults.Web) { WriteIndented = true }));
        TestContext.Progress.WriteLine(markdown);

        // Saved before the gates are asserted, so a run with a finding can still become the baseline.
        if (Environment.GetEnvironmentVariable("CV_EVAL_UPDATE_BASELINE") == "1" && only is null)
        {
            CvEvalReport.SaveBaseline(baselinePath, CvEvalReport.ToBaseline(LiveCvGenerationTests.Model, rows));
        }

        Assert.That(rows.Where(r => !r.Passed).Select(r => r.Fixture), Is.Empty, "Hard gates failed; see summary.md.");
    }

    private static async Task<CvEvalRow> RunOneAsync(CvEvalFixture fixture, ICvGenerationAiService cvAi, string outDir)
    {
        var profile = fixture.ToProfile();
        var background = CvBackgroundBuilder.BuildWithWarnings(profile, null);
        var h = fixture.Header;
        var request = CvGenerationPipeline.BuildRequest(
            h.FullName, h.Email, h.Phone, h.Location,
            new CvGenerationInputs(
                fixture.Job.Title, fixture.Job.Description,
                Requirements: await CvGenerationPipeline.ReadRequirementsAsync(cvAi, fixture.Job.Description, default)),
            background, DateOnly.FromDateTime(DateTime.UtcNow));

        var result = await CvGenerationPipeline.RunAsync(cvAi, request, background, default);

        var pdf = new QuestPdfCvRenderer().Render("classic", new CvHeaderDto(h.FullName, h.Email, h.Phone, h.Location), result.Cv);
        using var stream = new MemoryStream(pdf);
        var text = await new CvTextExtractor().ExtractTextAsync(stream, "cv.pdf", default);

        File.WriteAllText(Path.Combine(outDir, $"{fixture.Name}.json"), CvDraftContent.Serialize(result.Cv));
        File.WriteAllBytes(Path.Combine(outDir, $"{fixture.Name}.pdf"), pdf);
        File.WriteAllText(Path.Combine(outDir, $"{fixture.Name}.warnings.txt"), string.Join("\n", result.Warnings));

        return CvEvalScoring.Evaluate(fixture, result.Cv, background, result.GroundingIssues, result.CopiedRuns, text, request.TargetPages);
    }
}
