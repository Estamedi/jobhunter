namespace backend.jobhunter.Application.Common.Interfaces;

public record CvGenerationRequest
{
    public string FullName { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Location { get; init; }
    public string JobTitle { get; init; } = string.Empty;
    public string? JobDescription { get; init; }
    public string? Instructions { get; init; }
    public string? BackgroundText { get; init; }
    public string? Tone { get; init; }
    public string? Language { get; init; }
}

public record CvExperienceDto
{
    public string Role { get; init; } = string.Empty;
    public string Company { get; init; } = string.Empty;
    public string? Location { get; init; }
    public string? StartDate { get; init; }
    public string? EndDate { get; init; }
    public List<string> Bullets { get; init; } = [];
}

public record CvEducationDto
{
    public string Degree { get; init; } = string.Empty;
    public string Institution { get; init; } = string.Empty;
    public string? StartDate { get; init; }
    public string? EndDate { get; init; }
    public string? Details { get; init; }
}

public record GeneratedCvDto
{
    public string Headline { get; init; } = string.Empty;
    public string Summary { get; init; } = string.Empty;
    public List<string> Skills { get; init; } = [];
    public List<CvExperienceDto> Experience { get; init; } = [];
    public List<CvEducationDto> Education { get; init; } = [];
    public List<string> Certifications { get; init; } = [];
    public List<string> Languages { get; init; } = [];
}

public interface ICvGenerationAiService
{
    Task<GeneratedCvDto> GenerateAsync(CvGenerationRequest request, CancellationToken cancellationToken);
}
