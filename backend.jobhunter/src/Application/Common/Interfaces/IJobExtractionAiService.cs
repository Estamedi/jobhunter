namespace backend.jobhunter.Application.Common.Interfaces;

public record JobPageContent(string Url, string Title, string? JsonLd, string Text);

public record ExtractedJobDto
{
    public string? JobTitle { get; init; }
    public string? CompanyName { get; init; }
    public string? CompanyWebsite { get; init; }
    public string? Country { get; init; }
    public string? City { get; init; }
    public string? WorkType { get; init; }
    public string? EmploymentType { get; init; }
    public decimal? SalaryMin { get; init; }
    public decimal? SalaryMax { get; init; }
    public string? Currency { get; init; }
    public string? Source { get; init; }
    public string? Description { get; init; }
    public string? Requirements { get; init; }
}

public interface IJobExtractionAiService
{
    Task<ExtractedJobDto> ExtractAsync(JobPageContent page, CancellationToken cancellationToken);
}
