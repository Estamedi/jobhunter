using backend.jobhunter.Application.Common.Interfaces;
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
}
