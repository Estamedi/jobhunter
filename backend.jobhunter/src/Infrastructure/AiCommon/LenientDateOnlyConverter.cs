using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace backend.jobhunter.Infrastructure.AiCommon;

// AI output sometimes drops the day ("2025-01") or month ("2025"); accept those as the first
// day of the period, and treat anything unparseable ("Present", "") as no date.
public class LenientDateOnlyConverter : JsonConverter<DateOnly?>
{
    private static readonly string[] Formats = ["yyyy-MM-dd", "yyyy-MM", "yyyy"];

    public override DateOnly? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null) return null;
        if (reader.TokenType != JsonTokenType.String) { reader.Skip(); return null; }

        var text = reader.GetString()?.Trim();
        return DateOnly.TryParseExact(text, Formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date)
            ? date
            : null;
    }

    public override void Write(Utf8JsonWriter writer, DateOnly? value, JsonSerializerOptions options)
    {
        if (value is null) writer.WriteNullValue();
        else writer.WriteStringValue(value.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
    }
}
