using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using backend.jobhunter.Infrastructure.AiCvGeneration;

namespace backend.jobhunter.Application.UnitTests.Eval;

public record CvEvalBaseline
{
    public string Model { get; init; } = "";
    public string PromptSha { get; init; } = "";
    public Dictionary<string, CvEvalMetrics> Rows { get; init; } = [];
}

// Writes the score table, and compares it with the saved baseline. The baseline holds numbers only, no
// CV text, so it is safe to keep in the repository.
public static class CvEvalReport
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { WriteIndented = true };

    // Changes with any edit to either system prompt.
    public static string PromptSha()
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(CvGenerationPrompt.SystemPrompt + "\n---\n" + CvGenerationPrompt.RefineSystemPrompt));
        return Convert.ToHexString(bytes)[..12].ToLowerInvariant();
    }

    public static CvEvalBaseline? LoadBaseline(string path)
        => File.Exists(path) ? JsonSerializer.Deserialize<CvEvalBaseline>(File.ReadAllText(path), Json) : null;

    public static CvEvalBaseline ToBaseline(string model, IEnumerable<CvEvalRow> rows)
        => new() { Model = model, PromptSha = PromptSha(), Rows = rows.Where(r => r.Error is null).ToDictionary(r => r.Fixture, r => r.Metrics) };

    public static void SaveBaseline(string path, CvEvalBaseline baseline)
        => File.WriteAllText(path, JsonSerializer.Serialize(baseline, Json) + "\n");

    public static string Markdown(string model, IReadOnlyList<CvEvalRow> rows, CvEvalBaseline? baseline)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"# CV evaluation");
        sb.AppendLine();
        sb.AppendLine($"Model `{model}`, prompt `{PromptSha()}`. One run per fixture, so only large changes mean anything.");
        sb.AppendLine();
        sb.AppendLine("| Fixture | Gates | Score | Must-have in text / skills only / total | Headline has title | Skills | Bullets per role | Words / target | Copied |");
        sb.AppendLine("|---|---|---|---|---|---|---|---|---|");
        foreach (var r in rows)
        {
            if (r.Error is not null)
            {
                sb.AppendLine($"| {r.Fixture} | ERROR: {r.Error} | | | | | | | |");
                continue;
            }
            var m = r.Metrics;
            var gates = r.Passed ? "PASS" : "FAIL: " + string.Join("; ", r.FailedGates);
            sb.AppendLine($"| {r.Fixture} | {gates} | {m.Score} | {m.MustHaveInText} / {m.MustHaveSkillsOnly} / {m.MustHaveTotal} | {(m.HeadlineHasJobTitle ? "yes" : "no")} | {m.SkillCount} | {m.AverageBullets} | {m.Words} / {m.TargetWords} | {m.CopiedRuns} |");
        }

        sb.AppendLine();
        if (baseline is null)
        {
            sb.AppendLine("No baseline yet. Set `CV_EVAL_UPDATE_BASELINE=1` to save this run as one.");
        }
        else
        {
            sb.AppendLine($"Compared with the baseline (model `{baseline.Model}`, prompt `{baseline.PromptSha}`):");
            sb.AppendLine();
            foreach (var r in rows.Where(r => r.Error is null))
            {
                if (!baseline.Rows.TryGetValue(r.Fixture, out var old))
                {
                    sb.AppendLine($"- {r.Fixture}: new fixture, no baseline");
                    continue;
                }
                var m = r.Metrics;
                sb.AppendLine($"- {r.Fixture}: score {Delta(old.Score, m.Score)}, must-have in text {Delta(old.MustHaveInText, m.MustHaveInText)}, skills {Delta(old.SkillCount, m.SkillCount)}, words {Delta(old.Words, m.Words)}");
            }
        }
        return sb.ToString();
    }

    private static string Delta(int before, int after)
        => after == before ? $"{after} (same)" : $"{after} ({after - before:+#;-#})";
}
