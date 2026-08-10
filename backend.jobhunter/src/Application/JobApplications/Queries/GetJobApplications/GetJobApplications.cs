using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.JobApplications.Queries.GetJobApplications;

public record JobApplicationDto(
    int Id,
    int CandidateId, string CandidateName,
    int JobRoleId, string JobRoleTitle,
    int CompanyId, string CompanyName,
    int? MainContactId, string? MainContactName,
    int? CvId, string? CvFileName,
    string Status, string Priority,
    DateTimeOffset? AppliedDate, DateTimeOffset? LastActivityDate,
    DateTimeOffset? NextFollowUpDate,
    string FollowUpStatus,
    string? ResumeVersion, string? CoverLetterVersion,
    decimal? ExpectedSalary, decimal? ActualOfferSalary, string? Currency,
    string? RejectionReason,
    string? JobRoleCountry, string? JobRoleWorkType, string? JobRoleDescription,
    DateTimeOffset Created, DateTimeOffset LastModified,
    string? JobRoleEmploymentType, string? JobRoleCity,
    decimal? JobRoleSalaryMin, decimal? JobRoleSalaryMax,
    string? JobRoleLink, string JobRoleSource
);

public record GetJobApplicationsResult(IReadOnlyList<JobApplicationDto> Items, int Total);

[Authorize]
public record GetJobApplicationsQuery(
    int? CandidateId = null,
    int? CompanyId = null,
    string? Status = null,
    string[]? Priority = null,
    string? Country = null,
    string[]? WorkType = null,
    string[]? EmploymentType = null,
    string? Source = null,
    string? JobTitle = null,
    decimal? SalaryMin = null,
    decimal? SalaryMax = null,
    DateTimeOffset? DateFrom = null,
    DateTimeOffset? DateTo = null,
    DateTimeOffset? FollowUpFrom = null,
    DateTimeOffset? FollowUpTo = null,
    string? FollowUpStatus = null,
    string? Search = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<GetJobApplicationsResult>;

public class GetJobApplicationsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetJobApplicationsQuery, GetJobApplicationsResult>
{
    public async Task<GetJobApplicationsResult> Handle(GetJobApplicationsQuery request, CancellationToken cancellationToken)
    {
        var query = context.Applications.AsNoTracking();
        var now = DateTimeOffset.UtcNow;
        var weekEnd = now.AddDays(7);

        if (request.CandidateId.HasValue)
            query = query.Where(a => a.CandidateId == request.CandidateId.Value);
        if (request.CompanyId.HasValue)
            query = query.Where(a => a.CompanyId == request.CompanyId.Value);
        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(a => a.Status == request.Status);
        if (request.Priority is { Length: > 0 })
        {
            var priorities = request.Priority
                .Select(p => Enum.TryParse<PriorityLevel>(p, out var level) ? (PriorityLevel?)level : null)
                .Where(p => p.HasValue)
                .Select(p => p!.Value)
                .ToList();
            if (priorities.Count > 0)
                query = query.Where(a => priorities.Contains(a.Priority));
        }
        if (!string.IsNullOrWhiteSpace(request.Country))
        {
            var country = request.Country.ToLower();
            query = query.Where(a => a.JobRole.Country != null && a.JobRole.Country.ToLower().Contains(country));
        }
        if (request.WorkType is { Length: > 0 })
            query = query.Where(a => request.WorkType.Contains(a.JobRole.WorkType));
        if (request.EmploymentType is { Length: > 0 })
            query = query.Where(a => request.EmploymentType.Contains(a.JobRole.EmploymentType));
        if (!string.IsNullOrWhiteSpace(request.Source))
            query = query.Where(a => a.JobRole.Source == request.Source);
        if (!string.IsNullOrWhiteSpace(request.JobTitle))
        {
            var jobTitle = request.JobTitle.ToLower();
            query = query.Where(a => a.JobRole.Title.ToLower().Contains(jobTitle));
        }
        if (request.SalaryMin.HasValue)
            query = query.Where(a => (a.JobRole.SalaryMax ?? a.JobRole.SalaryMin) >= request.SalaryMin.Value);
        if (request.SalaryMax.HasValue)
            query = query.Where(a => (a.JobRole.SalaryMin ?? a.JobRole.SalaryMax) <= request.SalaryMax.Value);
        if (request.DateFrom.HasValue)
            query = query.Where(a => a.AppliedDate >= request.DateFrom.Value);
        if (request.DateTo.HasValue)
            query = query.Where(a => a.AppliedDate <= request.DateTo.Value);
        if (request.FollowUpFrom.HasValue)
            query = query.Where(a => a.NextFollowUpDate >= request.FollowUpFrom.Value);
        if (request.FollowUpTo.HasValue)
            query = query.Where(a => a.NextFollowUpDate <= request.FollowUpTo.Value);
        if (!string.IsNullOrWhiteSpace(request.FollowUpStatus))
            query = query.Where(a =>
                (a.NextFollowUpDate == null ? "NotNeeded"
                    : a.NextFollowUpDate.Value.Date == now.Date ? "DueToday"
                    : a.NextFollowUpDate.Value < now ? "Overdue"
                    : a.NextFollowUpDate.Value <= weekEnd ? "ThisWeek"
                    : "NotNeeded") == request.FollowUpStatus);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(a =>
                a.Candidate.FullName.ToLower().Contains(search) ||
                a.Company.Name.ToLower().Contains(search) ||
                a.JobRole.Title.ToLower().Contains(search));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(a => a.LastActivityDate ?? a.Created)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => new JobApplicationDto(
                a.Id,
                a.CandidateId, a.Candidate.FullName,
                a.JobRoleId, a.JobRole.Title,
                a.CompanyId, a.Company.Name,
                a.MainContactId, a.MainContact != null ? a.MainContact.FullName : null,
                a.CvId, a.Cv != null ? a.Cv.FileName : null,
                a.Status, a.Priority.ToString(),
                a.AppliedDate, a.LastActivityDate, a.NextFollowUpDate,
                a.NextFollowUpDate == null ? "NotNeeded"
                    : a.NextFollowUpDate.Value.Date == now.Date ? "DueToday"
                    : a.NextFollowUpDate.Value < now ? "Overdue"
                    : a.NextFollowUpDate.Value <= weekEnd ? "ThisWeek"
                    : "NotNeeded",
                a.ResumeVersion, a.CoverLetterVersion,
                a.ExpectedSalary, a.ActualOfferSalary, a.Currency,
                a.RejectionReason,
                a.JobRole.Country, a.JobRole.WorkType, a.JobRole.Description,
                a.Created, a.LastModified,
                a.JobRole.EmploymentType, a.JobRole.City,
                a.JobRole.SalaryMin, a.JobRole.SalaryMax,
                a.JobRole.JobLink, a.JobRole.Source))
            .ToListAsync(cancellationToken);

        return new GetJobApplicationsResult(items, total);
    }
}
