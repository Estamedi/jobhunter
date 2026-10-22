using System.IO.Compression;
using System.Text;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Infrastructure.CvImport;
using backend.jobhunter.Infrastructure.CvRendering;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.Infrastructure;

public class CvTextExtractorTests
{
    private readonly CvTextExtractor _extractor = new();

    private static MemoryStream Docx(string body)
    {
        var stream = new MemoryStream();
        using (var zip = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            var entry = zip.CreateEntry("word/document.xml");
            using var writer = new StreamWriter(entry.Open(), new UTF8Encoding(false));
            writer.Write(
                "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                "<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body>" +
                body + "</w:body></w:document>");
        }
        stream.Position = 0;
        return stream;
    }

    [Test]
    public async Task ShouldReadParagraphsAndTabsFromDocx()
    {
        using var docx = Docx(
            "<w:p><w:r><w:t>Jane Sample</w:t></w:r></w:p>" +
            "<w:p><w:r><w:t>Acme</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>Jan 2025 - Present</w:t></w:r></w:p>");

        var text = await _extractor.ExtractTextAsync(docx, "cv.docx", default);

        text.ShouldContain("Jane Sample");
        text.ShouldContain("Acme\tJan 2025 - Present");
    }

    [Test]
    public async Task ShouldReadTextBackFromGeneratedPdf()
    {
        var pdf = new QuestPdfCvRenderer().Render(
            "classic",
            new CvHeaderDto("Jane Sample", "jane@example.com", null, "Muscat"),
            new GeneratedCvDto { Headline = "Engineer", Summary = "Builds things." });
        using var stream = new MemoryStream(pdf);

        var text = await _extractor.ExtractTextAsync(stream, "cv.pdf", default);

        text.ShouldContain("Jane Sample");
        text.ShouldContain("Builds things.");
    }

    [Test]
    public async Task ShouldRejectUnsupportedExtension()
    {
        using var stream = new MemoryStream("hello"u8.ToArray());

        var ex = await Should.ThrowAsync<InvalidOperationException>(
            () => _extractor.ExtractTextAsync(stream, "cv.txt", default));

        ex.Message.ShouldContain("PDF and DOCX");
    }

    [Test]
    public async Task ShouldRejectDocumentWithoutText()
    {
        using var docx = Docx("<w:p/>");

        var ex = await Should.ThrowAsync<InvalidOperationException>(
            () => _extractor.ExtractTextAsync(docx, "cv.docx", default));

        ex.Message.ShouldContain("No readable text");
    }
}
