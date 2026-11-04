using backend.jobhunter.Infrastructure.CvRendering;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.Infrastructure;

public class CvStyleTests
{
    // WCAG relative luminance and contrast ratio against a white page.
    private static double Luminance(string hex)
    {
        double Channel(int start)
        {
            var c = Convert.ToInt32(hex.TrimStart('#').Substring(start, 2), 16) / 255.0;
            return c <= 0.03928 ? c / 12.92 : Math.Pow((c + 0.055) / 1.055, 2.4);
        }
        return 0.2126 * Channel(0) + 0.7152 * Channel(2) + 0.0722 * Channel(4);
    }

    private static double ContrastOnWhite(string hex) => 1.05 / (Luminance(hex) + 0.05);

    [Test]
    public void ShouldKeepTheClassicLookExactlyAsItWas()
    {
        var c = CvStyles.Classic;

        c.HeadingColor.ShouldBe("#4285F4");
        c.CompanyColor.ShouldBe("#1155CC");
        c.NameColor.ShouldBe("#353744");
        c.MutedColor.ShouldBe("#404040");
        c.BodyColor.ShouldBe("#000000");
        c.BodySize.ShouldBe(10.5f);
        c.NameSize.ShouldBe(16f);
        c.SectionTitleSize.ShouldBe(11.5f);
        c.MarginInches.ShouldBe(0.75f);
        c.LineHeight.ShouldBe(1.24f);
        c.BlockSpacing.ShouldBe(6f);
        c.ExperienceSpacing.ShouldBe(8f);
    }

    [Test]
    public void ShouldFallBackToClassicForAnUnknownOrMissingTemplate()
    {
        CvStyles.For("does-not-exist").ShouldBeSameAs(CvStyles.Classic);
        CvStyles.For(null).ShouldBeSameAs(CvStyles.Classic);
        CvStyles.For("neutral").ShouldBeSameAs(CvStyles.Neutral);
        CvStyles.For("compact").ShouldBeSameAs(CvStyles.Compact);
        CvTemplates.All.Select(CvStyles.For).Select(s => s.Id).ShouldBe(CvTemplates.All);
    }

    [TestCase(CvTemplates.Neutral)]
    [TestCase(CvTemplates.Compact)]
    public void ShouldKeepTextReadableOnPaperInTheNeutralStyles(string templateId)
    {
        var style = CvStyles.For(templateId);

        foreach (var color in new[] { style.HeadingColor, style.CompanyColor, style.NameColor, style.MutedColor, style.BodyColor })
        {
            ContrastOnWhite(color).ShouldBeGreaterThanOrEqualTo(4.5, $"{templateId} {color}");
        }
    }

    [Test]
    public void ShouldKeepTheCompactBodyTextAtALegibleSize()
        => CvStyles.Compact.BodySize.ShouldBeGreaterThanOrEqualTo(9.5f);

    [Test]
    public void ShouldReportTheContrastOfTheClassicColours()
    {
        // Recorded, not enforced: the classic colours are the owner's reference and are not changed here.
        var c = CvStyles.Classic;
        TestContext.Out.WriteLine($"CONTRAST classic heading {ContrastOnWhite(c.HeadingColor):F2}:1, company {ContrastOnWhite(c.CompanyColor):F2}:1, muted {ContrastOnWhite(c.MutedColor):F2}:1");
        ContrastOnWhite(c.BodyColor).ShouldBeGreaterThan(4.5);
    }
}
