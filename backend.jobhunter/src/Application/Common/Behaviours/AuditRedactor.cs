using System.Text.Json;
using System.Text.Json.Nodes;

namespace backend.jobhunter.Application.Common.Behaviours;

/// <summary>Turns a command into audit-safe JSON: secrets removed, long text shortened, total size capped.</summary>
public static class AuditRedactor
{
    private const int MaxText = 200;
    private const int MaxPayload = 3900;
    private static readonly string[] SecretWords = ["password", "token", "secret", "apikey", "key", "code"];

    public static string? Serialize(object? request)
    {
        if (request is null) return null;

        JsonNode? node;
        try
        {
            node = JsonSerializer.SerializeToNode(request, request.GetType());
        }
        catch (Exception)
        {
            return null;
        }

        var cleaned = Clean(node, null);
        var json = cleaned?.ToJsonString();
        return json is { Length: > MaxPayload } ? json[..MaxPayload] + "…" : json;
    }

    private static JsonNode? Clean(JsonNode? node, string? name)
    {
        switch (node)
        {
            case JsonObject obj:
                var copy = new JsonObject();
                foreach (var (key, value) in obj)
                    copy[key] = Clean(value, key);
                return copy;
            case JsonArray array:
                var items = new JsonArray();
                foreach (var item in array) items.Add(Clean(item, name));
                return items;
            case JsonValue value when name is not null && IsSecret(name) && value.GetValueKind() == JsonValueKind.String:
                return "[redacted]";
            case JsonValue value when value.TryGetValue<string>(out var text) && text.Length > MaxText:
                return text[..MaxText] + $"… ({text.Length} characters)";
            default:
                return node?.DeepClone();
        }
    }

    private static bool IsSecret(string name) =>
        SecretWords.Any(word => name.Contains(word, StringComparison.OrdinalIgnoreCase));
}
