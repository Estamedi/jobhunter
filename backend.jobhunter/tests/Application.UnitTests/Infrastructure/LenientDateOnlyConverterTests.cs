using System.Text.Json;
using backend.jobhunter.Infrastructure.AiCommon;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.Infrastructure;

public class LenientDateOnlyConverterTests
{
    private record Holder(DateOnly? Date);

    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new LenientDateOnlyConverter() },
    };

    private static DateOnly? Parse(string jsonValue)
        => JsonSerializer.Deserialize<Holder>($"{{\"date\": {jsonValue}}}", Options)!.Date;

    [Test]
    public void ShouldParseFullDate() => Parse("\"2025-03-01\"").ShouldBe(new DateOnly(2025, 3, 1));

    [Test]
    public void ShouldTreatMissingDayAsFirstOfMonth() => Parse("\"2025-03\"").ShouldBe(new DateOnly(2025, 3, 1));

    [Test]
    public void ShouldTreatMissingMonthAsFirstOfYear() => Parse("\"2025\"").ShouldBe(new DateOnly(2025, 1, 1));

    [TestCase("null")]
    [TestCase("\"Present\"")]
    [TestCase("\"\"")]
    [TestCase("12")]
    public void ShouldTreatUnusableValuesAsNoDate(string value) => Parse(value).ShouldBeNull();

    [Test]
    public void ShouldWriteIsoDate()
        => JsonSerializer.Serialize(new Holder(new DateOnly(2025, 3, 1)), Options).ShouldContain("2025-03-01");
}
