using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using Microsoft.EntityFrameworkCore;

namespace backend.jobhunter.Application.JobExtraction.Commands.ExtractJob;

[Authorize]
public record ExtractJobCommand(string Url, string Title, string? JsonLd, string Text) : IRequest<ExtractedJobDto>;

public class ExtractJobCommandHandler(IApplicationDbContext context, IJobExtractionAiService aiService)
    : IRequestHandler<ExtractJobCommand, ExtractedJobDto>
{
    public async Task<ExtractedJobDto> Handle(ExtractJobCommand request, CancellationToken cancellationToken)
    {
        // Already saved this exact job posting before (matched by link)? Reuse the
        // saved data instead of paying for another AI extraction call.
        var existing = await context.JobRoles
            .Include(r => r.Company)
            .Where(r => r.JobLink == request.Url)
            .OrderByDescending(r => r.Created)
            .FirstOrDefaultAsync(cancellationToken);

        if (existing is not null)
        {
            return new ExtractedJobDto
            {
                JobTitle = existing.Title,
                CompanyName = existing.Company.Name,
                CompanyWebsite = existing.Company.Website,
                Country = existing.Country,
                City = existing.City,
                WorkType = existing.WorkType,
                EmploymentType = existing.EmploymentType,
                SalaryMin = existing.SalaryMin,
                SalaryMax = existing.SalaryMax,
                Currency = existing.Currency,
                Source = existing.Source,
                Description = existing.Description,
                Requirements = existing.Requirements,
            };
        }

        return await aiService.ExtractAsync(
            new JobPageContent(request.Url, request.Title, request.JsonLd, request.Text), cancellationToken);
    }
}
