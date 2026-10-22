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

public record ParsedProfileDto
{
    public string? Headline { get; init; }
    public string? Summary { get; init; }
    public List<ParsedExperienceDto> Experiences { get; init; } = [];
    public List<ParsedEducationDto> Educations { get; init; } = [];
    public List<ParsedSkillDto> Skills { get; init; } = [];
}

public interface IProfileImportAiService
{
    Task<ParsedProfileDto> ParseAsync(string cvText, CancellationToken cancellationToken);
}
