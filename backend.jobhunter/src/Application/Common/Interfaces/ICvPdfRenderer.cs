namespace backend.jobhunter.Application.Common.Interfaces;

public record CvHeaderDto(string FullName, string? Email, string? Phone, string? Location);

public interface ICvPdfRenderer
{
    byte[] Render(string templateId, CvHeaderDto header, GeneratedCvDto content);
}
