using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Dashboard.Queries.GetCandidateDashboard;

public record CandidateDashboardDto(
    int CandidateId, string CandidateName, string CandidateEmail,
    int TotalApplications,
    IReadOnlyDictionary<string, int> ApplicationsByStatus,
    int TotalInterviews,
    int TotalOffers,
    int TotalRejections,
    double ResponseRate,
    double RejectionRate,
    int FollowUpsDue,
    IReadOnlyList<UpcomingCandidateInterview> UpcomingInterviews,
    IReadOnlyList<RecentCandidateActivity> RecentActivities
);

public record UpcomingCandidateInterview(
    int Id, string CompanyName, string Round,
    DateTimeOffset InterviewDate, string? MeetingLink
);

public record RecentCandidateActivity(
    int Id, string Type, string? CompanyName,
    DateTimeOffset ActivityDate, string? Notes
);

[Authorize]
public record GetCandidateDashboardQuery(int CandidateId) : IRequest<CandidateDashboardDto>;

public class GetCandidateDashboardQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCandidateDashboardQuery, CandidateDashboardDto>
{
    public async Task<CandidateDashboardDto> Handle(GetCandidateDashboardQuery request, CancellationToken cancellationToken)
    {
        var candidate = await context.Candidates.AsNoTracking()
            .Where(c => c.Id == request.CandidateId)
            .Select(c => new { c.Id, c.FullName, c.Email })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Candidate", request.CandidateId);

        var now = DateTimeOffset.UtcNow;
        var today = now.Date;

        var apps = await context.Applications.AsNoTracking()
            .Where(a => a.CandidateId == request.CandidateId)
            .Select(a => new { a.Status, a.NextFollowUpDate })
            .ToListAsync(cancellationToken);

        var byStatus = apps.GroupBy(a => a.Status)
            .ToDictionary(g => g.Key, g => g.Count());

        var applied = apps.Count(a => a.Status != "Wishlist" && a.Status != "Preparing");
        var responded = apps.Count(a => a.Status == "HRInterview" || a.Status == "TechnicalInterview" ||
                                         a.Status == "FinalInterview" || a.Status == "Offer");
        var offers = apps.Count(a => a.Status == "Offer");
        var rejections = apps.Count(a => a.Status == "Rejected");
        var followUpsDue = apps.Count(a => a.NextFollowUpDate.HasValue && a.NextFollowUpDate.Value.Date <= today);

        var responseRate = applied > 0 ? Math.Round((double)responded / applied * 100, 1) : 0;
        var rejectionRate = applied > 0 ? Math.Round((double)rejections / applied * 100, 1) : 0;

        var interviews = await context.Interviews.AsNoTracking()
            .Where(i => i.CandidateId == request.CandidateId && i.InterviewDate >= now && i.Status == "Scheduled")
            .OrderBy(i => i.InterviewDate)
            .Take(5)
            .Select(i => new UpcomingCandidateInterview(i.Id, i.Company.Name, i.Round, i.InterviewDate, i.MeetingLink))
            .ToListAsync(cancellationToken);

        var activities = await context.Activities.AsNoTracking()
            .Where(a => a.CandidateId == request.CandidateId)
            .OrderByDescending(a => a.ActivityDate)
            .Take(10)
            .Select(a => new RecentCandidateActivity(
                a.Id, a.Type,
                a.Company != null ? a.Company.Name : null,
                a.ActivityDate, a.Notes))
            .ToListAsync(cancellationToken);

        var totalInterviews = await context.Interviews.CountAsync(i => i.CandidateId == request.CandidateId, cancellationToken);

        return new CandidateDashboardDto(
            candidate.Id, candidate.FullName, candidate.Email,
            apps.Count, byStatus, totalInterviews, offers, rejections,
            responseRate, rejectionRate, followUpsDue,
            interviews, activities);
    }
}
