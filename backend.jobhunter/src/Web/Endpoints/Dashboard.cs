using backend.jobhunter.Application.Dashboard.Queries.GetOverallDashboard;
using backend.jobhunter.Application.Dashboard.Queries.GetReportStatistics;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class Dashboard : IEndpointGroup
{
    public static string? RoutePrefix => "/api/dashboard";

    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();
        group.MapGet(GetOverall, "overall");
        group.MapGet(GetReports, "reports");
    }

    [EndpointSummary("Get overall dashboard stats")]
    public static async Task<Ok<OverallDashboardDto>> GetOverall(ISender sender, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetOverallDashboardQuery(), ct));

    [EndpointSummary("Get report statistics")]
    public static async Task<Ok<ReportStatisticsDto>> GetReports(ISender sender, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetReportStatisticsQuery(), ct));
}
