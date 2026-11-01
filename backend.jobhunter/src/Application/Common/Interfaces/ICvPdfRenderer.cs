namespace backend.jobhunter.Application.Common.Interfaces;

public record CvHeaderDto(string FullName, string? Email, string? Phone, string? Location);

public interface ICvDocxRenderer
{
    byte[] Render(CvHeaderDto header, GeneratedCvDto content);
}

public interface ICvPdfRenderer
{
    byte[] Render(string templateId, CvHeaderDto header, GeneratedCvDto content);
}
