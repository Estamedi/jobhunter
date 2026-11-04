namespace backend.jobhunter.Application.Common.Interfaces;

public record CvHeaderDto(string FullName, string? Email, string? Phone, string? Location);

public interface ICvDocxRenderer
{
    // The template id picks the palette; an unknown id means the classic look.
    byte[] Render(CvHeaderDto header, GeneratedCvDto content, string? templateId = null);
}

public interface ICvPdfRenderer
{
    byte[] Render(string templateId, CvHeaderDto header, GeneratedCvDto content);
}
