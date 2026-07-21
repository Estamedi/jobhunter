using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.JobApplications.Queries.GetJobApplication;

public record JobApplicationDetailDto(
    int Id,
    int CandidateId, string CandidateName,
    int JobRoleId, string JobRoleTitle,
    int CompanyId, string CompanyName,
    int? MainContactId, string? MainContactName,
    int? CvId, string? CvFileName,
    string Status, string Priority,
    DateTimeOffset? AppliedDate, DateTimeOffset? LastActivityDate, DateTimeOffset? NextFollowUpDate,
    string FollowUpStatus,
    string? ResumeVersion, string? CoverLetterVersion,
    decimal? ExpectedSalary, decimal? ActualOfferSalary, string? Currency,
    string? RejectionReason,
    string? JobRoleCountry, string? JobRoleWorkType, string? JobRoleSource, string? JobRoleDescription,
    DateTimeOffset Created, DateTimeOffset LastModified
);

[Authorize]
public record GetJobApplicationQuery(int Id) : IRequest<JobApplicationDetailDto>;

public class GetJobApplicationQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetJobApplicationQuery, JobApplicationDetailDto>
{
    public async Task<JobApplicationDetailDto> Handle(GetJobApplicationQuery request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var weekEnd = now.AddDays(7);

        var a = await context.Applications.AsNoTracking()
            .Where(a => a.Id == request.Id)
            .Select(a => new JobApplicationDetailDto(
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
                a.JobRole.Country, a.JobRole.WorkType, a.JobRole.Source, a.JobRole.Description,
                a.Created, a.LastModified))
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("JobApplication", request.Id);

        return a;
    }
}
