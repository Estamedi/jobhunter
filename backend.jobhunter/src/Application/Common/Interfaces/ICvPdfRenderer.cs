namespace backend.jobhunter.Application.Common.Interfaces;

// Photo and Availability are only drawn by the photo template. Photo holds the image bytes (JPEG or PNG);
// a photo that cannot be read is left out rather than failing the export.
public record CvHeaderDto(
    string FullName, string? Email, string? Phone, string? Location,
    byte[]? Photo = null, string? Availability = null);

public interface ICvDocxRenderer
{
    // The template id picks the palette; an unknown id means the classic look.
    byte[] Render(CvHeaderDto header, GeneratedCvDto content, string? templateId = null);
}

public interface ICvPdfRenderer
{
    byte[] Render(string templateId, CvHeaderDto header, GeneratedCvDto content);
}
