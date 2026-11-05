using backend.jobhunter.Application.CvDrafts;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Infrastructure.CvImport;
using backend.jobhunter.Infrastructure.CvRendering;
using NUnit.Framework;
using Shouldly;
using UglyToad.PdfPig;

namespace backend.jobhunter.Application.UnitTests.Infrastructure;

public class CvPhotoTemplateTests
{
    // Any valid PNG will do as a stand-in for a photo.
    private static readonly byte[] SamplePhoto = CvImages.QrCodePng("stand-in for a photo");

    private static readonly CvHeaderDto Header =
        new("Jane Sample", "jane@example.com", "(+000) 123", "Muscat, Oman", SamplePhoto, "Immediately");

    private static GeneratedCvDto Cv(params string[] links) => new()
    {
        Headline = "Full Stack Developer",
        Summary = "Engineer with **8+ years** of experience.",
        Skills = [new CvSkillGroupDto { Category = "Backend", Items = ["C#", "SQL"] }],
        Experience = [new CvExperienceDto { Role = "Lead", Company = "Acme", StartDate = "Jan 2022", Bullets = ["Cut costs by 30%."] }],
        Education = [new CvEducationDto { Degree = "BSc", Institution = "Uni", StartDate = "2010", EndDate = "2014" }],
        Links = links.ToList(),
    };

    private static int ImageCount(byte[] pdf)
    {
        using var document = PdfDocument.Open(pdf);
        return document.GetPages().Sum(p => p.GetImages().Count());
    }

    private static async Task<string> TextAsync(byte[] pdf)
    {
        using var stream = new MemoryStream(pdf);
        return await new CvTextExtractor().ExtractTextAsync(stream, "cv.pdf", default);
    }

    private static byte[] Render(string template, CvHeaderDto header, GeneratedCvDto cv)
        => new QuestPdfCvRenderer().Render(template, header, cv);

    [Test]
    public void ShouldDrawThePhotoAndTheQrCodeWhenBothAreThere()
        => ImageCount(Render(CvTemplates.Photo, Header, Cv("https://www.linkedin.com/in/jane-sample/"))).ShouldBe(2);

    [Test]
    public void ShouldDrawOnlyThePhotoWithoutALinkAndOnlyTheQrCodeWithoutAPhoto()
    {
        ImageCount(Render(CvTemplates.Photo, Header, Cv())).ShouldBe(1);
        ImageCount(Render(CvTemplates.Photo, Header with { Photo = null }, Cv("https://www.linkedin.com/in/jane"))).ShouldBe(1);
        ImageCount(Render(CvTemplates.Photo, Header with { Photo = null }, Cv())).ShouldBe(0);
    }

    [Test]
    public void ShouldLeaveOutAPhotoThatCannotBeReadInsteadOfFailingTheExport()
    {
        byte[] corrupt = [0xFF, 0xD8, 0xFF, 0x00, 0x01, 0x02, 0x03];

        var pdf = Render(CvTemplates.Photo, Header with { Photo = corrupt }, Cv("https://www.linkedin.com/in/jane"));

        ImageCount(pdf).ShouldBe(1); // only the QR code
        CvImages.UsablePhoto(corrupt).ShouldBeNull();
        CvImages.UsablePhoto(SamplePhoto).ShouldBe(SamplePhoto);
    }

    [TestCase(CvTemplates.Classic)]
    [TestCase(CvTemplates.Neutral)]
    [TestCase(CvTemplates.Compact)]
    public void ShouldNeverDrawAPhotoOrAQrCodeOnTheOtherTemplates(string templateId)
        => ImageCount(Render(templateId, Header, Cv("https://www.linkedin.com/in/jane-sample/"))).ShouldBe(0);

    [Test]
    public async Task ShouldKeepTheNameContactDetailsAndLinkAsTextBeforeTheSummary()
    {
        var text = await TextAsync(Render(CvTemplates.Photo, Header, Cv("https://www.linkedin.com/in/jane-sample/")));

        var summary = text.IndexOf("Summary", StringComparison.Ordinal);
        foreach (var expected in new[] { "Jane Sample", "Full Stack Developer", "Residence: Muscat, Oman", "Phone: (+000) 123", "Email: jane@example.com", "Availability: Immediately", "linkedin.com/in/jane-sample" })
        {
            var at = text.IndexOf(expected, StringComparison.Ordinal);
            at.ShouldBeGreaterThanOrEqualTo(0, expected);
            at.ShouldBeLessThan(summary, expected);
        }
    }

    [Test]
    public async Task ShouldOmitALabelledLineThatHasNoValueAndShowAvailabilityOnlyOnThePhotoTemplate()
    {
        var photoText = await TextAsync(Render(CvTemplates.Photo, Header with { Phone = null, Availability = null }, Cv()));
        photoText.ShouldNotContain("Phone:");
        photoText.ShouldNotContain("Availability:");

        var classicText = await TextAsync(Render(CvTemplates.Classic, Header, Cv()));
        classicText.ShouldNotContain("Availability");
        classicText.ShouldNotContain("Residence:");
    }

    [Test]
    public void ShouldDrawNoQrCodeWhenTheOnlyLinkIsNotLinkedIn()
        => ImageCount(Render(CvTemplates.Photo, Header, Cv("https://github.com/jane"))).ShouldBe(1);

    [Test]
    public void ShouldKeepTheProfilesLinkedInUrlWhateverTheModelWrote()
    {
        var profile = new CandidateProfile { Links = [new ProfileLink { Label = "LinkedIn", Url = "https://www.linkedin.com/in/jane-sample" }] };

        CvProfileMerger.MergeLinks(["linkedin.com/in/jane-samle", "https://made-up.example"], profile)
            .ShouldBe(["https://www.linkedin.com/in/jane-sample"]);
        CvProfileMerger.MergeLinks([], profile).ShouldBe(["https://www.linkedin.com/in/jane-sample"]);
    }

    [Test]
    public void ShouldMakeAQrCodeThatIsAValidPng()
    {
        var png = CvImages.QrCodePng("https://example.com");

        png.Take(8).ShouldBe(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A });
    }

    [Test]
    public void ShouldTreatThePhotoTemplateAsAKnownStyleWithTheClassicColours()
    {
        CvStyles.For("photo").PhotoHeader.ShouldBeTrue();
        CvStyles.For("photo").HeadingColor.ShouldBe(CvStyles.Classic.HeadingColor);
        CvStyles.Classic.PhotoHeader.ShouldBeFalse();
        CvTemplates.All.ShouldContain("photo");
    }

    private static DocumentFormat.OpenXml.Packaging.WordprocessingDocument OpenDocx(byte[] docx)
        => DocumentFormat.OpenXml.Packaging.WordprocessingDocument.Open(new MemoryStream(docx), false);

    [Test]
    public void ShouldPutThePhotoAndTheQrCodeInTheWordFileAsFloatingPicturesThatAreValid()
    {
        var docx = new DocxCvRenderer().Render(Header, Cv("https://www.linkedin.com/in/jane-sample/"), CvTemplates.Photo);

        using var document = OpenDocx(docx);
        var body = document.MainDocumentPart!.Document!.Body!;
        body.Descendants<DocumentFormat.OpenXml.Drawing.Wordprocessing.Anchor>().Count().ShouldBe(2);
        document.MainDocumentPart.ImageParts.Count().ShouldBe(2);

        // The text stays in ordinary paragraphs, in reading order, before the Summary heading.
        var text = body.InnerText;
        text.IndexOf("Jane Sample", StringComparison.Ordinal).ShouldBeLessThan(text.IndexOf("Summary", StringComparison.Ordinal));
        text.ShouldContain("Residence: Muscat, Oman");
        text.ShouldContain("Availability: Immediately");
        text.ShouldContain("linkedin.com/in/jane-sample");

        var errors = new DocumentFormat.OpenXml.Validation.OpenXmlValidator().Validate(document).Select(e => e.Description).ToList();
        errors.ShouldBeEmpty(string.Join("; ", errors));
    }

    [Test]
    public void ShouldLeaveOutThePicturesInTheWordFileWhenThereIsNoPhotoOrLinkOrOnAnotherTemplate()
    {
        using (var bare = OpenDocx(new DocxCvRenderer().Render(Header with { Photo = null }, Cv(), CvTemplates.Photo)))
        {
            bare.MainDocumentPart!.Document!.Body!.Descendants<DocumentFormat.OpenXml.Wordprocessing.Drawing>().ShouldBeEmpty();
        }
        using (var classic = OpenDocx(new DocxCvRenderer().Render(Header, Cv("https://github.com/jane"), CvTemplates.Classic)))
        {
            classic.MainDocumentPart!.Document!.Body!.Descendants<DocumentFormat.OpenXml.Wordprocessing.Drawing>().ShouldBeEmpty();
            classic.MainDocumentPart.Document.Body.InnerText.ShouldNotContain("Availability");
        }
    }

    [Test]
    public void ShouldSkipACorruptPhotoInTheWordFile()
    {
        byte[] corrupt = [0xFF, 0xD8, 0xFF, 0x00, 0x01];

        using var document = OpenDocx(new DocxCvRenderer().Render(Header with { Photo = corrupt }, Cv("https://www.linkedin.com/in/jane"), CvTemplates.Photo));

        document.MainDocumentPart!.Document!.Body!.Descendants<DocumentFormat.OpenXml.Wordprocessing.Drawing>().Count().ShouldBe(1); // QR only
    }
}
