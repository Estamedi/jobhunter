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
    string? RejectionReason, string? Notes,
    string? JobRoleCountry, string? JobRoleWorkType, string? JobRoleDescription,
    DateTimeOffset Created, DateTimeOffset LastModified
);

public record GetJobApplicationsResult(IReadOnlyList<JobApplicationDto> Items, int Total);

[Authorize]
public record GetJobApplicationsQuery(
    int? CandidateId = null,
    int? CompanyId = null,
    string? Status = null,
    string? Priority = null,
    string? Country = null,
    string? WorkType = null,
    string? Source = null,
    DateTimeOffset? DateFrom = null,
    DateTimeOffset? DateTo = null,
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

        if (request.CandidateId.HasValue)
            query = query.Where(a => a.CandidateId == request.CandidateId.Value);
        if (request.CompanyId.HasValue)
            query = query.Where(a => a.CompanyId == request.CompanyId.Value);
        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(a => a.Status == request.Status);
        if (!string.IsNullOrWhiteSpace(request.Priority) && Enum.TryParse<PriorityLevel>(request.Priority, out var priority))
            query = query.Where(a => a.Priority == priority);
        if (!string.IsNullOrWhiteSpace(request.Country))
            query = query.Where(a => a.JobRole.Country == request.Country);
        if (!string.IsNullOrWhiteSpace(request.WorkType))
            query = query.Where(a => a.JobRole.WorkType == request.WorkType);
        if (!string.IsNullOrWhiteSpace(request.Source))
            query = query.Where(a => a.JobRole.Source == request.Source);
        if (request.DateFrom.HasValue)
            query = query.Where(a => a.AppliedDate >= request.DateFrom.Value);
        if (request.DateTo.HasValue)
            query = query.Where(a => a.AppliedDate <= request.DateTo.Value);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(a =>
                a.Candidate.FullName.ToLower().Contains(search) ||
                a.Company.Name.ToLower().Contains(search) ||
                a.JobRole.Title.ToLower().Contains(search));
        }

        var total = await query.CountAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;
        var weekEnd = now.AddDays(7);

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
                a.RejectionReason, a.Notes,
                a.JobRole.Country, a.JobRole.WorkType, a.JobRole.Description,
                a.Created, a.LastModified))
            .ToListAsync(cancellationToken);

        return new GetJobApplicationsResult(items, total);
    }
}
