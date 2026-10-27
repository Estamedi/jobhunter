using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.CvDrafts;

public class CvVersioningTests
{
    private static string Json(string summary) => CvDraftContent.Serialize(new GeneratedCvDto { Summary = summary });

    [Test]
    public void ShouldNotSeeAChangeWhenOnlyKeyOrderAndWhitespaceDiffer()
    {
        // jsonb returns keys in its own order and without whitespace; the content is the same.
        var reordered = """{ "summary": "Hello", "headline": "", "skills": [], "projects": [], "experience": [], "education": [], "certifications": [], "languages": [], "links": [] }""";

        CvVersioning.HasChanged(Json("Hello"), reordered).ShouldBeFalse();
    }

    [Test]
    public void ShouldSeeARealChange()
        => CvVersioning.HasChanged(Json("Hello"), Json("Hello there")).ShouldBeTrue();

    [Test]
    public void ShouldStoreTheNormalisedForm()
        => CvVersioning.Normalize("""{ "summary":"Hi" }""").ShouldBe(Json("Hi"));

    [TestCase(0, 0)]
    [TestCase(18, 0)]
    [TestCase(19, 0)]
    [TestCase(20, 1)]
    [TestCase(23, 4)]
    public void ShouldPruneOnlyWhatPassesTwentyAfterAddingOne(int existing, int expectedExcess)
        => CvVersioning.ExcessAfterAddingOne(existing).ShouldBe(expectedExcess);

    [Test]
    public void ShouldKeepTwentyVersionsPerDraft()
        => CvVersioning.MaxVersionsPerDraft.ShouldBe(20);
}
