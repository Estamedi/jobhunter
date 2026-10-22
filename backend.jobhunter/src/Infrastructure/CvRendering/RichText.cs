using QuestPDF.Fluent;

namespace backend.jobhunter.Infrastructure.CvRendering;

// Renders text where **double asterisks** mark bold segments.
public static class RichText
{
    public static void AppendRich(this TextDescriptor text, string? value, Action<TextSpanDescriptor>? style = null)
    {
        if (string.IsNullOrEmpty(value)) return;

        var parts = value.Split("**");
        for (var i = 0; i < parts.Length; i++)
        {
            if (parts[i].Length == 0) continue;
            var span = text.Span(parts[i]);
            style?.Invoke(span);
            if (i % 2 == 1) span.Bold();
        }
    }
}
