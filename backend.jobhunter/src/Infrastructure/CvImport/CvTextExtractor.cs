using System.IO.Compression;
using System.Text;
using System.Xml.Linq;
using backend.jobhunter.Application.Common.Interfaces;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;

namespace backend.jobhunter.Infrastructure.CvImport;

public class CvTextExtractor : ICvTextExtractor
{
    private static readonly XNamespace W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

    public async Task<string> ExtractTextAsync(Stream content, string fileName, CancellationToken cancellationToken)
    {
        // PdfPig and ZipArchive need a seekable stream.
        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);
        buffer.Position = 0;

        var text = Path.GetExtension(fileName).ToLowerInvariant() switch
        {
            ".pdf" => ReadPdf(buffer),
            ".docx" => ReadDocx(buffer),
            _ => throw new InvalidOperationException("Only PDF and DOCX files can be imported."),
        };

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException(
                "No readable text was found in this file. If it is a scanned PDF, upload a text-based PDF or DOCX.");
        }

        return text.Trim();
    }

    private static string ReadPdf(Stream stream)
    {
        using var document = PdfDocument.Open(stream);
        var pages = document.GetPages().Select(page => ContentOrderTextExtractor.GetText(page));
        return string.Join("\n\n", pages);
    }

    private static string ReadDocx(Stream stream)
    {
        using var zip = new ZipArchive(stream, ZipArchiveMode.Read);
        var entry = zip.GetEntry("word/document.xml")
            ?? throw new InvalidOperationException("This DOCX file could not be read.");

        using var entryStream = entry.Open();
        var document = XDocument.Load(entryStream);

        var sb = new StringBuilder();
        foreach (var paragraph in document.Descendants(W + "p"))
        {
            foreach (var node in paragraph.Descendants())
            {
                if (node.Name == W + "t") sb.Append(node.Value);
                else if (node.Name == W + "tab") sb.Append('\t');
                else if (node.Name == W + "br") sb.Append('\n');
            }
            sb.AppendLine();
        }
        return sb.ToString();
    }
}
