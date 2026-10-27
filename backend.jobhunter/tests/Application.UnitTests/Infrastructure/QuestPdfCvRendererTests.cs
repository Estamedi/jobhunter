using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Infrastructure.CvImport;
using backend.jobhunter.Infrastructure.CvRendering;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.Infrastructure;

public class QuestPdfCvRendererTests
{
    private static readonly CvHeaderDto Header = new("Jane Sample", "jane@example.com", "123", "Muscat");

    [Test]
    public void ShouldRenderAPdfForAnEmptyCv()
    {
        var pdf = new QuestPdfCvRenderer().Render("classic", Header, new GeneratedCvDto());

        System.Text.Encoding.ASCII.GetString(pdf, 0, 5).ShouldBe("%PDF-");
    }

    [Test]
    public void ShouldRenderAFullCvAndFallBackToClassicForUnknownTemplates()
    {
        var cv = new GeneratedCvDto
        {
            Headline = "Senior Engineer",
            Summary = "Has **12+ years** of experience.",
            Skills = [new CvSkillGroupDto { Category = "Backend", Items = ["C#", ".NET"] }],
            Projects = [new CvProjectDto { Name = "Detector", Description = "AI", Url = "https://example.com" }],
            Experience =
            [
                new CvExperienceDto
                {
                    Role = "Lead", Company = "Acme", StartDate = "Jan 2025",
                    Bullets = ["Cut **costs** by 30%."],
                },
            ],
            Education = [new CvEducationDto { Degree = "BSc", Institution = "Uni", StartDate = "2010", EndDate = "2012" }],
            Certifications = ["AZ-204"],
            Languages = ["English"],
            Links = ["https://github.com/example", "linkedin.com/in/example"],
        };

        var classic = new QuestPdfCvRenderer().Render("classic", Header, cv);
        var unknown = new QuestPdfCvRenderer().Render("does-not-exist", Header, cv);

        classic.Length.ShouldBeGreaterThan(1000);
        unknown.Length.ShouldBeGreaterThan(1000);
    }

    // ATS round trip: an applicant tracking system reads the PDF as text, so render a full CV and read
    // it back the same way we read uploaded CVs.
    [Test]
    public async Task ShouldKeepEverythingAnAtsNeedsWhenThePdfIsReadBackAsText()
    {
        var cv = new GeneratedCvDto
        {
            Headline = "Senior Engineer",
            Summary = "Has **12+ years** of experience.",
            Skills = [new CvSkillGroupDto { Category = "Backend", Items = ["C#", ".NET"] }],
            Projects = [new CvProjectDto { Name = "Detector", Description = "AI", Url = "https://example.com" }],
            Experience =
            [
                new CvExperienceDto { Role = "Lead", Company = "Acme", Location = "Muscat", StartDate = "Jan 2025", Bullets = ["Cut **costs** by 30%."] },
                new CvExperienceDto { Role = "Developer", Company = "Globex", StartDate = "Feb 2020", EndDate = "Apr 2022", Bullets = ["Built the billing API."] },
            ],
            Education = [new CvEducationDto { Degree = "BSc", Institution = "Uni", StartDate = "2010", EndDate = "2012" }],
            Certifications = ["AZ-204"],
            Languages = ["English"],
            Links = ["https://github.com/example"],
        };

        var pdf = new QuestPdfCvRenderer().Render("classic", Header, cv);
        using var stream = new MemoryStream(pdf);
        var text = await new CvTextExtractor().ExtractTextAsync(stream, "cv.pdf", default);

        // Name, contact details, dates and company names survive as plain text.
        foreach (var expected in new[]
                 {
                     "Jane Sample", "jane@example.com", "Muscat", "Senior Engineer", "Acme", "Globex",
                     "Jan 2025", "Feb 2020 - Apr 2022", "Cut costs by 30%", "Built the billing API", "AZ-204",
                 })
        {
            text.ShouldContain(expected);
        }

        // Standard headings appear, in reading order.
        var headings = new[] { "Summary", "Professional Skills", "Recent Projects", "Experience", "Education", "Certifications", "Additional Information" };
        var positions = headings.Select(h => text.IndexOf(h, StringComparison.Ordinal)).ToList();
        positions.ShouldAllBe(p => p >= 0);
        positions.ShouldBe(positions.OrderBy(p => p).ToList());

        // Newest role comes before the older one.
        text.IndexOf("Acme", StringComparison.Ordinal).ShouldBeLessThan(text.IndexOf("Globex", StringComparison.Ordinal));
    }
}
