using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Dashboard.Queries.GetOverallDashboard;

public record OverallDashboardDto(
    int TotalCandidates,
    int ActiveCandidates,
    int TotalApplications,
    int ActiveApplications,
    int TotalInterviews,
    int UpcomingInterviews,
    int TotalCompanies,
    int OffersReceived,
    int FollowUpsDueToday,
    int FollowUpsOverdue,
    IReadOnlyList<RecentActivityItem> RecentActivities,
    IReadOnlyList<UpcomingInterviewItem> UpcomingInterviewsList
);

public record RecentActivityItem(
    int Id, string Type, string CandidateName, string? CompanyName,
    DateTimeOffset ActivityDate, string? Notes
);

public record UpcomingInterviewItem(
    int Id, string CandidateName, string CompanyName,
    string? JobRoleTitle, string Round, DateTimeOffset InterviewDate,
    string Status, string? MeetingLink
);

[Authorize]
public record GetOverallDashboardQuery : IRequest<OverallDashboardDto>;

public class GetOverallDashboardQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetOverallDashboardQuery, OverallDashboardDto>
{
    public async Task<OverallDashboardDto> Handle(GetOverallDashboardQuery request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var today = now.Date;

        var totalCandidates = await context.Candidates.CountAsync(cancellationToken);
        var activeCandidates = await context.Candidates.CountAsync(c => c.IsActive, cancellationToken);
        var totalCompanies = await context.Companies.CountAsync(cancellationToken);

        var totalApps = await context.Applications.CountAsync(cancellationToken);
        var activeApps = await context.Applications
            .CountAsync(a => a.Status != "Rejected" && a.Status != "Withdrawn", cancellationToken);
        var totalInterviews = await context.Interviews.CountAsync(cancellationToken);
        var upcomingInterviews = await context.Interviews
            .CountAsync(i => i.InterviewDate >= now && i.Status == "Scheduled", cancellationToken);
        var offersReceived = await context.Applications.CountAsync(a => a.Status == "Offer", cancellationToken);

        var followUpsDueToday = await context.Applications
            .CountAsync(a => a.NextFollowUpDate.HasValue && a.NextFollowUpDate.Value.Date == today, cancellationToken);
        var followUpsOverdue = await context.Applications
            .CountAsync(a => a.NextFollowUpDate.HasValue && a.NextFollowUpDate.Value < now && a.NextFollowUpDate.Value.Date != today, cancellationToken);

        var recentActivities = await context.Activities
            .AsNoTracking()
            .OrderByDescending(a => a.ActivityDate)
            .Take(10)
            .Select(a => new RecentActivityItem(
                a.Id, a.Type, a.Candidate.FullName,
                a.Company != null ? a.Company.Name : null,
                a.ActivityDate, a.Notes))
            .ToListAsync(cancellationToken);

        var upcomingInterviewsList = await context.Interviews
            .AsNoTracking()
            .Where(i => i.InterviewDate >= now && i.Status == "Scheduled")
            .OrderBy(i => i.InterviewDate)
            .Take(5)
            .Select(i => new UpcomingInterviewItem(
                i.Id, i.Candidate.FullName, i.Company.Name,
                i.Application.JobRole.Title,
                i.Round, i.InterviewDate, i.Status, i.MeetingLink))
            .ToListAsync(cancellationToken);

        return new OverallDashboardDto(
            totalCandidates, activeCandidates, totalApps, activeApps,
            totalInterviews, upcomingInterviews, totalCompanies, offersReceived,
            followUpsDueToday, followUpsOverdue,
            recentActivities, upcomingInterviewsList);
    }
}
