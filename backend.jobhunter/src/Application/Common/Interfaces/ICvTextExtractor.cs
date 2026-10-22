namespace backend.jobhunter.Application.Common.Interfaces;

public interface ICvTextExtractor
{
    // Reads the plain text of a PDF or DOCX file; throws if the format is unsupported or has no text.
    Task<string> ExtractTextAsync(Stream content, string fileName, CancellationToken cancellationToken);
}
