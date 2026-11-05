using backend.jobhunter.Application.Common.Models;
using backend.jobhunter.Application.Workers;
using backend.jobhunter.Application.Workers.Commands;
using backend.jobhunter.Application.Workers.Queries;
using System.Security.Claims;
using backend.jobhunter.Domain.Constants;
using backend.jobhunter.Web.Services;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class Workers : IEndpointGroup
{
    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.RequireAuthorization();
        groupBuilder.MapGet(GetOverview, "overview");
        groupBuilder.MapGet(GetJobs, "jobs");
        groupBuilder.MapGet(GetJob, "jobs/{id}");
        groupBuilder.MapPost(RequeueJob, "jobs/{id}/requeue");
        groupBuilder.MapDelete(DeleteJob, "jobs/{id}");
        groupBuilder.MapPost(TriggerRecurring, "recurring/{id}/trigger");
        groupBuilder.MapPost(CreateDashboardLink, "dashboard-link");
    }

    [EndpointSummary("Background worker overview")]
    [EndpointDescription("Administrator only. Job counts, queues, running servers, recurring polls and how many items wait in each database queue.")]
    public static async Task<Ok<WorkersOverviewDto>> GetOverview(ISender sender, CancellationToken cancellationToken)
        => TypedResults.Ok(await sender.Send(new GetWorkersOverviewQuery(), cancellationToken));

    [EndpointSummary("List background jobs")]
    [EndpointDescription("Administrator only. A page of jobs in one state: Enqueued, Scheduled, Processing, Succeeded, Failed or Deleted.")]
    public static async Task<Ok<PaginatedList<WorkerJobDto>>> GetJobs(
        ISender sender, CancellationToken cancellationToken, string state = "Failed", int page = 1, int pageSize = 25)
        => TypedResults.Ok(await sender.Send(new GetWorkerJobsQuery(state, page, pageSize), cancellationToken));

    [EndpointSummary("Get a background job")]
    [EndpointDescription("Administrator only. A job with its state history. Arguments are not returned.")]
    public static async Task<Ok<WorkerJobDetailDto>> GetJob(ISender sender, string id, CancellationToken cancellationToken)
        => TypedResults.Ok(await sender.Send(new GetWorkerJobQuery(id), cancellationToken));

    [EndpointSummary("Run a background job again")]
    [EndpointDescription("Administrator only. Puts a failed, succeeded or deleted job back in its queue.")]
    public static async Task<NoContent> RequeueJob(ISender sender, string id, CancellationToken cancellationToken)
    {
        await sender.Send(new RequeueWorkerJobCommand(id), cancellationToken);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete a background job")]
    [EndpointDescription("Administrator only. Removes a job so it is not run (or retried) again.")]
    public static async Task<NoContent> DeleteJob(ISender sender, string id, CancellationToken cancellationToken)
    {
        await sender.Send(new DeleteWorkerJobCommand(id), cancellationToken);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Run a recurring poll now")]
    [EndpointDescription("Administrator only. Starts one of the recurring polls straight away.")]
    public static async Task<NoContent> TriggerRecurring(ISender sender, string id, CancellationToken cancellationToken)
    {
        await sender.Send(new TriggerRecurringWorkerJobCommand(id), cancellationToken);
        return TypedResults.NoContent();
    }

    public record DashboardLinkDto(string Path);

    [EndpointSummary("Open the Hangfire dashboard")]
    [EndpointDescription("Administrator only. Returns a path that is valid for one minute; opening it in a browser signs that browser in to the Hangfire dashboard at /hangfire.")]
    public static Results<Ok<DashboardLinkDto>, ForbidHttpResult> CreateDashboardLink(ClaimsPrincipal user, IDataProtectionProvider provider)
        => user.IsInRole(Roles.Administrator)
            ? TypedResults.Ok(new DashboardLinkDto(HangfireDashboardAccess.CreateLink(provider)))
            : TypedResults.Forbid();
}
