using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Dashboard.Queries.GetReportStatistics;

public record ReportStatisticsDto(
    int TotalApplications,
    int TotalInterviews,
    int TotalOffers,
    int TotalRejected,
    double ResponseRate,
    double InterviewConversionRate,
    double OfferRate,
    Dictionary<string, int> ApplicationsByStatus,
    Dictionary<string, int> ApplicationsByCandidate,
    Dictionary<string, int> ApplicationsByCountry,
    Dictionary<string, int> ApplicationsByWorkType,
    IReadOnlyList<MonthlyTrendItem> MonthlyApplicationTrend
);

public record MonthlyTrendItem(string Month, int Count);

[Authorize]
public record GetReportStatisticsQuery : IRequest<ReportStatisticsDto>;

public class GetReportStatisticsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetReportStatisticsQuery, ReportStatisticsDto>
{
    public async Task<ReportStatisticsDto> Handle(GetReportStatisticsQuery request, CancellationToken cancellationToken)
    {
        var totalApps = await context.Applications.CountAsync(cancellationToken);
        var totalInterviews = await context.Interviews.CountAsync(cancellationToken);
        var totalOffers = await context.Applications.CountAsync(a => a.Status == "Offer", cancellationToken);
        var totalRejected = await context.Applications.CountAsync(a => a.Status == "Rejected", cancellationToken);

        var applied = await context.Applications.CountAsync(a => a.Status != "Wishlist" && a.Status != "Preparing", cancellationToken);
        var responded = await context.Applications.CountAsync(a =>
            a.Status == "HRInterview" || a.Status == "TechnicalInterview" ||
            a.Status == "FinalInterview" || a.Status == "Offer", cancellationToken);

        var responseRate = applied > 0 ? Math.Round((double)responded / applied * 100, 1) : 0;
        var interviewConversionRate = totalInterviews > 0 ? Math.Round((double)totalOffers / totalInterviews * 100, 1) : 0;
        var offerRate = applied > 0 ? Math.Round((double)totalOffers / applied * 100, 1) : 0;

        var byStatus = await context.Applications
            .GroupBy(a => a.Status)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var byCandidate = await context.Applications
            .GroupBy(a => a.Candidate.FullName)
            .Select(g => new { g.Key, Count = g.Count() })
            .OrderByDescending(c => c.Count)
            .ToListAsync(cancellationToken);

        var byCountry = await context.Applications
            .Where(a => a.JobRole.Country != null)
            .GroupBy(a => a.JobRole.Country!)
            .Select(g => new { g.Key, Count = g.Count() })
            .OrderByDescending(c => c.Count)
            .ToListAsync(cancellationToken);

        var byWorkType = await context.Applications
            .GroupBy(a => a.JobRole.WorkType)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var monthly = await context.Applications
            .Where(a => a.AppliedDate.HasValue)
            .GroupBy(a => new { a.AppliedDate!.Value.Year, a.AppliedDate.Value.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() })
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToListAsync(cancellationToken);

        var monthlyTrend = monthly
            .Select(m => new MonthlyTrendItem(
                new DateTime(m.Year, m.Month, 1).ToString("MMM yyyy"),
                m.Count))
            .ToList();

        return new ReportStatisticsDto(
            totalApps, totalInterviews, totalOffers, totalRejected,
            responseRate, interviewConversionRate, offerRate,
            byStatus.ToDictionary(x => x.Key, x => x.Count),
            byCandidate.ToDictionary(x => x.Key, x => x.Count),
            byCountry.ToDictionary(x => x.Key, x => x.Count),
            byWorkType.ToDictionary(x => x.Key, x => x.Count),
            monthlyTrend);
    }
}
