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
    [TestCaseSource(typeof(CvTemplates), nameof(CvTemplates.All))]
    public async Task ShouldKeepEverythingAnAtsNeedsWhenThePdfIsReadBackAsText(string templateId)
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

        var pdf = new QuestPdfCvRenderer().Render(templateId, Header, cv);
        using var stream = new MemoryStream(pdf);
        var text = await new CvTextExtractor().ExtractTextAsync(stream, "cv.pdf", default);

        // Name, contact details, dates and company names survive as plain text.
        foreach (var expected in new[]
                 {
                     "Jane Sample", "Muscat", "123", "jane@example.com", "Senior Engineer", "Acme", "Globex",
                     "Jan 2025", "Feb 2020 \u2013 Apr 2022", "Cut costs by 30%", "Built the billing API", "AZ-204",
                 })
        {
            text.ShouldContain(expected);
        }

        // Standard headings appear, in reading order.
        var headings = new[] { "Summary", "Technical Skills", "Professional Experience", "Projects", "Education", "Certifications", "Additional Information" };
        var positions = headings.Select(h => text.IndexOf(h, StringComparison.Ordinal)).ToList();
        positions.ShouldAllBe(p => p >= 0);
        positions.ShouldBe(positions.OrderBy(p => p).ToList());

        // Newest role comes before the older one.
        text.IndexOf("Acme", StringComparison.Ordinal).ShouldBeLessThan(text.IndexOf("Globex", StringComparison.Ordinal));
    }

    private static readonly string[] LongSentences =
    [
        "Senior engineer with 13 years of experience delivering production systems across payments, healthcare and government, with a focus on architecture, reliable delivery and clear communication with business owners.",
    ];

    [TestCaseSource(typeof(CvTemplates), nameof(CvTemplates.All))]
    public async Task ShouldNotMergeWordsInALongWrappedSummaryNowThatTextIsNotJustified(string templateId)
    {
        var cv = new GeneratedCvDto
        {
            Summary = LongSentences[0],
            Experience = [new CvExperienceDto { Role = "Lead", Company = "Acme", StartDate = "Jan 2025", Bullets = [LongSentences[0]] }],
        };

        var pdf = new QuestPdfCvRenderer().Render(templateId, Header, cv);
        using var stream = new MemoryStream(pdf);
        var text = await new CvTextExtractor().ExtractTextAsync(stream, "cv.pdf", default);
        var collapsed = System.Text.RegularExpressions.Regex.Replace(text, @"\s+", " ");

        collapsed.ShouldContain(LongSentences[0]);
    }

    [Test]
    public void ShouldPutAuthorSubjectAndKeywordsInThePdfMetadata()
    {
        var cv = new GeneratedCvDto
        {
            Headline = "DevOps Engineer | Terraform",
            Skills = [new CvSkillGroupDto { Category = "DevOps", Items = ["**Terraform**", "Ansible", "terraform", "Docker"] }],
        };

        var metadata = new ClassicCvDocument(Header, cv).GetMetadata();

        metadata.Author.ShouldBe("Jane Sample");
        metadata.Subject.ShouldBe("DevOps Engineer | Terraform");
        metadata.Keywords.ShouldBe("Terraform, Ansible, Docker");
    }

    [Test]
    public void ShouldCapTheKeywordsAtTwentySkills()
    {
        var cv = new GeneratedCvDto
        {
            Skills = [new CvSkillGroupDto { Category = "All", Items = Enumerable.Range(1, 30).Select(i => $"Skill{i}").ToList() }],
        };

        ClassicCvDocument.Keywords(cv).Split(", ").Length.ShouldBe(20);
    }

    [Test]
    public async Task ShouldShowTheLinkedInLinkInTheHeaderAndNotRepeatItInAdditionalInformation()
    {
        var cv = new GeneratedCvDto
        {
            Summary = "Engineer.",
            Languages = ["English"],
            Links = ["https://github.com/example", "https://www.linkedin.com/in/example/"],
        };

        var pdf = new QuestPdfCvRenderer().Render("classic", Header, cv);
        using var stream = new MemoryStream(pdf);
        var text = await new CvTextExtractor().ExtractTextAsync(stream, "cv.pdf", default);

        text.IndexOf("linkedin.com/in/example", StringComparison.Ordinal).ShouldBeInRange(0, text.IndexOf("Summary", StringComparison.Ordinal));
        text.Split("linkedin.com/in/example").Length.ShouldBe(2);
        text.ShouldContain("github.com/example");
    }

    [Test]
    public void ShouldUseTheFirstLinkInTheHeaderWhenThereIsNoLinkedIn()
    {
        var cv = new GeneratedCvDto { Links = ["github.com/example", "example.com"] };

        ClassicCvDocument.HeaderLink(cv).ShouldBe("github.com/example");
        ClassicCvDocument.OtherLinks(cv).ShouldBe(["example.com"]);
        ClassicCvDocument.LinkUrl("github.com/example").ShouldBe("https://github.com/example");
        ClassicCvDocument.LinkText("https://github.com/example/").ShouldBe("github.com/example");
    }

    [Test]
    public void ShouldWriteDocxPropertiesAndLeaveTextLeftAligned()
    {
        var cv = new GeneratedCvDto
        {
            Headline = "DevOps Engineer",
            Summary = LongSentences[0],
            Skills = [new CvSkillGroupDto { Category = "DevOps", Items = ["Terraform", "Ansible"] }],
            Experience = [new CvExperienceDto { Role = "Lead", Company = "Acme", Bullets = [LongSentences[0]] }],
            Links = ["https://www.linkedin.com/in/example/"],
        };

        var docx = new DocxCvRenderer().Render(Header, cv);
        using var stream = new MemoryStream(docx);
        using var document = DocumentFormat.OpenXml.Packaging.WordprocessingDocument.Open(stream, false);

        document.PackageProperties.Creator.ShouldBe("Jane Sample");
        document.PackageProperties.Subject.ShouldBe("DevOps Engineer");
        document.PackageProperties.Keywords.ShouldBe("Terraform, Ansible");
        document.MainDocumentPart!.Document!.Body!.Descendants<DocumentFormat.OpenXml.Wordprocessing.Justification>()
            .ShouldNotContain(j => j.Val!.Value == DocumentFormat.OpenXml.Wordprocessing.JustificationValues.Both);
        document.MainDocumentPart!.Document!.Body!.InnerText.ShouldContain("linkedin.com/in/example");
    }

    [TestCase(null, "4285F4", "1F1F1F")]
    [TestCase("classic", "4285F4", "1F1F1F")]
    [TestCase("unknown-template", "4285F4", "1F1F1F")]
    [TestCase("neutral", "1F1F1F", "4285F4")]
    [TestCase("compact", "1F1F1F", "4285F4")]
    public void ShouldColourTheDocxHeadingsLikeTheChosenTemplate(string? templateId, string expected, string notExpected)
    {
        var cv = new GeneratedCvDto
        {
            Summary = "Engineer.",
            Experience = [new CvExperienceDto { Role = "Lead", Company = "Acme", Bullets = ["Cut costs by 30%."] }],
        };

        var docx = new DocxCvRenderer().Render(Header, cv, templateId);
        using var stream = new MemoryStream(docx);
        using var document = DocumentFormat.OpenXml.Packaging.WordprocessingDocument.Open(stream, false);
        var colours = document.MainDocumentPart!.Document!.Body!
            .Descendants<DocumentFormat.OpenXml.Wordprocessing.Color>().Select(c => c.Val!.Value).ToList();

        colours.ShouldContain(expected);
        colours.ShouldNotContain(notExpected);
    }
}
