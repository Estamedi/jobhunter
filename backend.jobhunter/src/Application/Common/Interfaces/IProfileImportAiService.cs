namespace backend.jobhunter.Application.Common.Interfaces;

public record ParsedExperienceDto
{
    public string Title { get; init; } = string.Empty;
    public string? EmploymentType { get; init; }
    public string Company { get; init; } = string.Empty;
    public bool IsCurrent { get; init; }
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
    public string? Location { get; init; }
    public string? WorkplaceType { get; init; }
    public string? Description { get; init; }
    public List<string> Skills { get; init; } = [];
}

public record ParsedEducationDto
{
    public string Institution { get; init; } = string.Empty;
    public string Degree { get; init; } = string.Empty;
    public string? FieldOfStudy { get; init; }
    public string? Location { get; init; }
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
    public string? Details { get; init; }
}

public record ParsedSkillDto
{
    public string Name { get; init; } = string.Empty;
    public string? Category { get; init; }
}

public record ParsedProjectDto
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? Url { get; init; }
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
}

public record ParsedCertificationDto
{
    public string Name { get; init; } = string.Empty;
    public string? Issuer { get; init; }
    public DateOnly? IssuedDate { get; init; }
    public DateOnly? ExpiryDate { get; init; }
    public string? CredentialUrl { get; init; }
}

public record ParsedLanguageDto
{
    public string Name { get; init; } = string.Empty;
    public string? Proficiency { get; init; }
}

public record ParsedLinkDto
{
    public string Label { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
}

public record ParsedProfileDto
{
    public string? Headline { get; init; }
    public string? Summary { get; init; }
    public List<ParsedExperienceDto> Experiences { get; init; } = [];
    public List<ParsedEducationDto> Educations { get; init; } = [];
    public List<ParsedSkillDto> Skills { get; init; } = [];
    public List<ParsedProjectDto> Projects { get; init; } = [];
    public List<ParsedCertificationDto> Certifications { get; init; } = [];
    public List<ParsedLanguageDto> Languages { get; init; } = [];
    public List<ParsedLinkDto> Links { get; init; } = [];
}

public interface IProfileImportAiService
{
    Task<ParsedProfileDto> ParseAsync(string cvText, CancellationToken cancellationToken);
}
