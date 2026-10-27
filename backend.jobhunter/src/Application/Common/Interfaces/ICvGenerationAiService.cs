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
    // Printed A4 pages to aim for (see CvLengthGuide); null when there is nothing to judge from.
    public int? TargetPages { get; init; }
}

public record CvExperienceDto
{
    // Id of the profile experience this entry comes from; the server overwrites role, company and
    // dates from that row so the AI cannot alter them. Null for entries typed in by hand.
    public int? SourceId { get; init; }
    public string Role { get; init; } = string.Empty;
    public string Company { get; init; } = string.Empty;
    public string? Location { get; init; }
    public string? StartDate { get; init; }
    public string? EndDate { get; init; }
    public List<string> Bullets { get; init; } = [];
}

public record CvEducationDto
{
    public int? SourceId { get; init; }
    public string Degree { get; init; } = string.Empty;
    public string Institution { get; init; } = string.Empty;
    public string? StartDate { get; init; }
    public string? EndDate { get; init; }
    public string? Details { get; init; }
}

public record CvSkillGroupDto
{
    public string Category { get; init; } = string.Empty;
    public List<string> Items { get; init; } = [];
}

public record CvProjectDto
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? Url { get; init; }
}

public record GeneratedCvDto
{
    public string Headline { get; init; } = string.Empty;
    public string Summary { get; init; } = string.Empty;
    public List<CvSkillGroupDto> Skills { get; init; } = [];
    public List<CvProjectDto> Projects { get; init; } = [];
    public List<CvExperienceDto> Experience { get; init; } = [];
    public List<CvEducationDto> Education { get; init; } = [];
    public List<string> Certifications { get; init; } = [];
    public List<string> Languages { get; init; } = [];
    public List<string> Links { get; init; } = [];
}

public record CvSectionRefineRequest
{
    public required GeneratedCvDto Current { get; init; }
    public required string Section { get; init; }
    public required string Instruction { get; init; }
    // The instructions the draft was originally generated with, so refining keeps the job-specific guidance.
    public string? DraftInstructions { get; init; }
    public string? Tone { get; init; }
    public string? Language { get; init; }
    public string JobTitle { get; init; } = string.Empty;
    public string? JobDescription { get; init; }
    public string? BackgroundText { get; init; }
}

public interface ICvGenerationAiService
{
    Task<GeneratedCvDto> GenerateAsync(CvGenerationRequest request, CancellationToken cancellationToken);

    // Returns the full CV with only the requested section rewritten.
    Task<GeneratedCvDto> RefineSectionAsync(CvSectionRefineRequest request, CancellationToken cancellationToken);
}
