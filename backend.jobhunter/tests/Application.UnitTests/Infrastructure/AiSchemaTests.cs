using System.Text.Json.Nodes;
using backend.jobhunter.Infrastructure.AiCvGeneration;
using backend.jobhunter.Infrastructure.AiProfileImport;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.Infrastructure;

// OpenAI's strict mode (and Claude's structured output) require every property to be listed as
// required and additionalProperties to be false, at every object level.
public class AiSchemaTests
{
    [TestCase(nameof(CvGenerationPrompt.CvSchemaJson))]
    [TestCase(nameof(ProfileImportPrompt.ProfileSchemaJson))]
    public void SchemaShouldBeStrictAtEveryLevel(string name)
    {
        var json = name == nameof(CvGenerationPrompt.CvSchemaJson)
            ? CvGenerationPrompt.CvSchemaJson
            : ProfileImportPrompt.ProfileSchemaJson;

        var violations = new List<string>();
        Walk(JsonNode.Parse(json)!, "$", violations);

        violations.ShouldBeEmpty();
    }

    private static void Walk(JsonNode node, string path, List<string> violations)
    {
        if (node is JsonObject obj)
        {
            if (obj["properties"] is JsonObject properties)
            {
                var required = obj["required"]?.AsArray().Select(n => n!.GetValue<string>()).ToHashSet() ?? [];
                foreach (var key in properties.Select(p => p.Key).Where(k => !required.Contains(k)))
                {
                    violations.Add($"{path}: '{key}' is not required");
                }

                if (obj["additionalProperties"]?.GetValue<bool>() != false)
                {
                    violations.Add($"{path}: additionalProperties must be false");
                }
            }

            foreach (var (key, child) in obj)
            {
                if (child is not null) Walk(child, $"{path}.{key}", violations);
            }
        }
        else if (node is JsonArray array)
        {
            for (var i = 0; i < array.Count; i++)
            {
                if (array[i] is not null) Walk(array[i]!, $"{path}[{i}]", violations);
            }
        }
    }
}
